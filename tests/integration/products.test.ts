import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createProduct, deleteProduct, getProductBySlug, setProductStatus, updateProduct } from "@/server/services/products";
import { searchProducts } from "@/server/services/search";
import { productSchema } from "@/lib/validation/product";
import { createCategory, createPendingImage, createUser, productInput } from "../helpers/factories";

describe("Products", () => {
  it("creates a product, attaches images and generates a unique slug", async () => {
    const seller = await createUser();
    const cat = await createCategory("bikes");
    const input = await productInput(seller.id, cat.id, { title: "Trek Marlin 7 mountain bike" });
    const product = await createProduct(seller.id, input);

    expect(product.slug).toMatch(/^trek-marlin-7-mountain-bike-[a-z0-9]{6}$/);
    expect(product.region).toBe("SHARON");
    expect(product.publishedAt).not.toBeNull();
    const images = await db.productImage.findMany({ where: { productId: product.id } });
    expect(images).toHaveLength(1);
    expect(images[0].isPrimary).toBe(true);

    const second = await createProduct(seller.id, await productInput(seller.id, cat.id, { title: "Trek Marlin 7 mountain bike" }));
    expect(second.slug).not.toBe(product.slug);
  });

  it("uses a fallback slug for Hebrew-only titles", async () => {
    const seller = await createUser();
    const cat = await createCategory();
    const product = await createProduct(seller.id, await productInput(seller.id, cat.id, { title: "ספה אפורה" }));
    expect(product.slug).toMatch(/^item-[a-z0-9]{6}$/);
  });

  it("refuses images uploaded by another user", async () => {
    const seller = await createUser();
    const other = await createUser();
    const cat = await createCategory();
    const foreign = await createPendingImage(other.id);
    const input = await productInput(seller.id, cat.id);
    await expect(createProduct(seller.id, { ...input, imageIds: [foreign.id], primaryImageId: foreign.id })).rejects.toThrow(/הרשאה/);
  });

  it("validates product input on the server (Zod)", () => {
    const result = productSchema.safeParse({ title: "a", categoryId: "", price: "-5", condition: "BROKEN", imageIds: [], city: "Paris", description: "short" });
    expect(result.success).toBe(false);
    const fields = Object.keys(result.error!.flatten().fieldErrors);
    expect(fields).toEqual(expect.arrayContaining(["title", "categoryId", "price", "condition", "imageIds", "city", "description"]));
  });

  it("lets only the owner edit; replaces and reorders images", async () => {
    const seller = await createUser();
    const intruder = await createUser();
    const cat = await createCategory();
    const input = await productInput(seller.id, cat.id);
    const product = await createProduct(seller.id, input);

    const newImg = await createPendingImage(seller.id);
    const edited = { ...input, title: "אופני ילדים — מחיר חדש", price: 400, imageIds: [newImg.id], primaryImageId: newImg.id };
    await expect(updateProduct(intruder.id, product.id, edited)).rejects.toThrow(/הרשאה/);

    const updated = await updateProduct(seller.id, product.id, edited);
    expect(updated.title).toBe("אופני ילדים — מחיר חדש");
    expect(updated.price).toBe(400);
    const images = await db.productImage.findMany({ where: { productId: product.id } });
    expect(images.map((i) => i.id)).toEqual([newImg.id]);
    expect(await db.productImage.findUnique({ where: { id: input.imageIds[0] } })).toBeNull();
  });

  it("lets only the owner delete", async () => {
    const seller = await createUser();
    const intruder = await createUser();
    const cat = await createCategory();
    const product = await createProduct(seller.id, await productInput(seller.id, cat.id));
    await expect(deleteProduct(intruder.id, product.id)).rejects.toThrow(/הרשאה/);
    await deleteProduct(seller.id, product.id);
    expect(await db.product.findUnique({ where: { id: product.id } })).toBeNull();
    expect(await db.productImage.count({ where: { productId: product.id } })).toBe(0);
  });

  it("hides SOLD products from search and keeps drafts private", async () => {
    const seller = await createUser();
    const viewer = await createUser();
    const cat = await createCategory();
    const product = await createProduct(seller.id, await productInput(seller.id, cat.id));
    expect((await searchProducts({})).total).toBe(1);

    await setProductStatus(seller.id, product.id, "SOLD");
    expect((await searchProducts({})).total).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).soldAt).not.toBeNull();
    expect(await getProductBySlug(product.slug, { id: viewer.id, role: "USER" })).not.toBeNull(); // sold page still viewable

    const draft = await createProduct(seller.id, await productInput(seller.id, cat.id, { status: "DRAFT" }));
    expect(draft.publishedAt).toBeNull();
    expect(await getProductBySlug(draft.slug, { id: viewer.id, role: "USER" })).toBeNull();
    expect(await getProductBySlug(draft.slug, null)).toBeNull();
    expect(await getProductBySlug(draft.slug, { id: seller.id, role: "USER" })).not.toBeNull();
  });

  it("prevents owners from editing admin-removed products", async () => {
    const seller = await createUser();
    const cat = await createCategory();
    const input = await productInput(seller.id, cat.id);
    const product = await createProduct(seller.id, input);
    await db.product.update({ where: { id: product.id }, data: { status: "REMOVED" } });
    await expect(setProductStatus(seller.id, product.id, "ACTIVE")).rejects.toThrow(/הוסר/);
    await expect(updateProduct(seller.id, product.id, input)).rejects.toThrow(/הוסר/);
  });
});
