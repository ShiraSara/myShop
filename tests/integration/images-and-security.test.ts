import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { db } from "@/server/db";
import { deleteImage, processAndStoreImage } from "@/server/services/images";
import { rateLimit } from "@/server/rate-limit";
import { createReport } from "@/server/services/reports";
import { adminSetUserStatus } from "@/server/services/admin";
import { createSession, validateSessionToken } from "@/server/auth/session";
import { createProduct } from "@/server/services/products";
import { createCategory, createUser, productInput } from "../helpers/factories";

describe("Image upload", () => {
  it("processes a real image into WebP and stores only URL + key", async () => {
    const user = await createUser();
    const png = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: "#0e7c66" } }).png().toBuffer();
    const img = await processAndStoreImage(user.id, { buffer: png, type: "image/png", size: png.length });
    expect(img.width).toBe(1600); // resized
    const row = await db.productImage.findUniqueOrThrow({ where: { id: img.id } });
    expect(row.mimeType).toBe("image/webp");
    expect(row.url).toMatch(/^\/uploads\/products\/.+\.webp$/);
    expect(row.productId).toBeNull();
  });

  it("rejects disallowed MIME types, fake images and oversized files", async () => {
    const user = await createUser();
    const text = Buffer.from("<script>alert(1)</script>".repeat(10));
    await expect(processAndStoreImage(user.id, { buffer: text, type: "image/png", size: text.length })).rejects.toThrow(/אינו תמונה/);
    await expect(processAndStoreImage(user.id, { buffer: text, type: "text/html", size: text.length })).rejects.toThrow(/סוג קובץ/);
    await expect(processAndStoreImage(user.id, { buffer: text, type: "image/png", size: 20 * 1024 * 1024 })).rejects.toThrow(/גדול מדי/);
  });

  it("only lets the uploader delete a pending image", async () => {
    const user = await createUser();
    const other = await createUser();
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#fff" } }).png().toBuffer();
    const img = await processAndStoreImage(user.id, { buffer: png, type: "image/png", size: png.length });
    await expect(deleteImage(other.id, img.id)).rejects.toThrow(/הרשאה/);
    await deleteImage(user.id, img.id);
    expect(await db.productImage.findUnique({ where: { id: img.id } })).toBeNull();
  });
});

describe("Security", () => {
  it("rate limits after the configured number of attempts", async () => {
    for (let i = 0; i < 3; i++) await rateLimit("test:key", 3, 60);
    await expect(rateLimit("test:key", 3, 60)).rejects.toThrow(/יותר מדי/);
  });

  it("blocking a user revokes their sessions; admins cannot block themselves", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const user = await createUser();
    const { token } = await createSession(user.id);
    await adminSetUserStatus(admin.id, user.id, "BLOCKED", "spam");
    expect(await validateSessionToken(token)).toBeNull();
    await expect(adminSetUserStatus(admin.id, admin.id, "BLOCKED")).rejects.toThrow();
  });

  it("allows one report per user per product and not on own products", async () => {
    const seller = await createUser();
    const reporter = await createUser();
    const cat = await createCategory();
    const product = await createProduct(seller.id, await productInput(seller.id, cat.id));
    await createReport(reporter.id, { productId: product.id, reason: "FRAUD", details: null });
    await expect(createReport(reporter.id, { productId: product.id, reason: "SPAM", details: null })).rejects.toThrow(/כבר דיווחתם/);
    await expect(createReport(seller.id, { productId: product.id, reason: "SPAM", details: null })).rejects.toThrow();
  });
});
