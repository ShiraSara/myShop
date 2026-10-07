/**
 * Deletes uploaded images that were never attached to a product (e.g. the user
 * abandoned the publish wizard). Schedule it daily (cron / Vercel Cron / GitHub Actions).
 *
 *   npm run cleanup:images            # default: older than 24h
 *   npm run cleanup:images -- 48      # older than 48h
 */
import { PrismaClient } from "@prisma/client";
import { localDriver } from "../src/server/storage/local";
import { createS3Driver } from "../src/server/storage/s3";

const db = new PrismaClient();
const storage = process.env.STORAGE_DRIVER === "s3" ? createS3Driver() : localDriver;

async function main() {
  const hours = Number(process.argv[2] ?? 24);
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);
  const orphans = await db.productImage.findMany({ where: { productId: null, createdAt: { lt: cutoff } } });
  for (const img of orphans) {
    await storage.delete(img.storageKey).catch((e) => console.error("delete failed", img.storageKey, e));
  }
  await db.productImage.deleteMany({ where: { id: { in: orphans.map((o) => o.id) } } });
  const expired = await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const limits = await db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  console.log(`Removed ${orphans.length} orphan images, ${expired.count} expired sessions, ${limits.count} rate-limit rows.`);
}

main().finally(() => db.$disconnect());
