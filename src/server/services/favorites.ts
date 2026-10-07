import "server-only";
import { db } from "../db";
import { NotFoundError, ValidationError } from "../errors";
import { productCardSelect } from "./product-queries";

/** Toggles a favorite. Returns the new state. */
export async function toggleFavorite(userId: string, productId: string) {
  const existing = await db.favorite.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) {
    await db.favorite.delete({ where: { userId_productId: { userId, productId } } });
    return { favorited: false };
  }
  const product = await db.product.findUnique({ where: { id: productId }, select: { status: true, sellerId: true } });
  if (!product || (product.status !== "ACTIVE" && product.status !== "SOLD")) throw new NotFoundError("המוצר לא נמצא");
  if (product.sellerId === userId) throw new ValidationError("לא ניתן לשמור מוצר שלכם למועדפים");
  await db.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
  return { favorited: true };
}

export async function listFavorites(userId: string) {
  const rows = await db.favorite.findMany({
    where: { userId, product: { status: { in: ["ACTIVE", "SOLD"] } } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, product: { select: productCardSelect } },
  });
  return rows.map((r) => r.product);
}

/** Which of the given products are favorited by the user (for rendering hearts). */
export async function favoriteIdsFor(userId: string | null | undefined, productIds: string[]): Promise<Set<string>> {
  if (!userId || productIds.length === 0) return new Set();
  const rows = await db.favorite.findMany({
    where: { userId, productId: { in: productIds } },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}
