import "server-only";
import sharp from "sharp";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { randomSuffix } from "@/lib/utils";
import { db } from "../db";
import { AppError, ForbiddenError, NotFoundError, StorageFailedError, ValidationError } from "../errors";
import { getStorage } from "../storage";

const MAX_DIMENSION = 1600;
const MAX_PENDING_UPLOADS = 30;

/** Magic-byte check — never trust the browser supplied MIME type alone. */
function sniffImage(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand.startsWith("avi")) return "image/avif";
    if (["heic", "heix", "mif1", "msf1", "hevc"].includes(brand)) return "image/heic";
  }
  return null;
}

export type UploadedImage = { id: string; url: string; width: number | null; height: number | null };

/**
 * Validates, normalises (rotate by EXIF, strip metadata, resize, convert to WebP)
 * and stores an image. The DB row is "pending" (productId = null) until a product claims it.
 */
export async function processAndStoreImage(
  uploaderId: string,
  file: { buffer: Buffer; type: string; size: number },
): Promise<UploadedImage> {
  if (file.size > MAX_IMAGE_BYTES) throw new ValidationError("הקובץ גדול מדי (עד 8MB)");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new ValidationError("סוג קובץ לא נתמך. ניתן להעלות JPG, PNG, WEBP");
  const sniffed = sniffImage(file.buffer);
  if (!sniffed) throw new ValidationError("הקובץ אינו תמונה תקינה");

  const pending = await db.productImage.count({ where: { uploaderId, productId: null } });
  if (pending >= MAX_PENDING_UPLOADS) throw new ValidationError("יותר מדי תמונות ממתינות. פרסמו את המוצר או נסו מאוחר יותר.");

  let output: { data: Buffer; info: { width: number; height: number; size: number } };
  try {
    output = await sharp(file.buffer, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ValidationError("לא ניתן לעבד את התמונה. נסו קובץ אחר.");
  }

  const now = new Date();
  const key = `products/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${uploaderId}-${Date.now()}-${randomSuffix(10)}.webp`;
  const storage = getStorage(); // throws StorageNotConfiguredError when storage isn't set up for this environment
  let url: string;
  try {
    ({ url } = await storage.put(key, output.data, "image/webp"));
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("[storage] upload failed", key, error);
    throw new StorageFailedError();
  }

  const image = await db.productImage.create({
    data: {
      uploaderId,
      url,
      storageKey: key,
      width: output.info.width,
      height: output.info.height,
      size: output.info.size,
      mimeType: "image/webp",
    },
  });
  return { id: image.id, url: image.url, width: image.width, height: image.height };
}

/** Deletes an image the user owns that is not yet attached to a product (or is on the user's product). */
export async function deleteImage(userId: string, imageId: string) {
  const image = await db.productImage.findUnique({ where: { id: imageId }, include: { product: true } });
  if (!image) throw new NotFoundError("התמונה לא נמצאה");
  if (image.uploaderId !== userId) throw new ForbiddenError();
  if (image.productId) throw new ValidationError("לא ניתן למחוק תמונה של מוצר מפורסם מכאן");
  await db.productImage.delete({ where: { id: imageId } });
  await deleteStoredFiles([image.storageKey]);
}

/** Removes files from storage (best effort) — used after product / image deletion. */
export async function deleteStoredFiles(keys: string[]) {
  if (keys.length === 0) return;
  let storage;
  try {
    storage = getStorage();
  } catch (e) {
    console.error("[storage] delete skipped — storage not configured", keys, e);
    return;
  }
  await Promise.all(keys.map((k) => storage.delete(k).catch((e) => console.error("[storage] delete failed", k, e))));
}

/** Cleanup job: pending uploads older than `hours` that were never attached to a product. */
export async function cleanupOrphanImages(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);
  const orphans = await db.productImage.findMany({ where: { productId: null, createdAt: { lt: cutoff } } });
  await db.productImage.deleteMany({ where: { id: { in: orphans.map((o) => o.id) } } });
  await deleteStoredFiles(orphans.map((o) => o.storageKey));
  return orphans.length;
}
