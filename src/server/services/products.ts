import "server-only";
import type { Prisma, ProductStatus } from "@prisma/client";
import { regionForCity } from "@/lib/locations";
import { randomSuffix, slugify } from "@/lib/utils";
import type { ProductInput } from "@/lib/validation/product";
import { db } from "../db";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { matchProductToRequests } from "../matching";
import { deleteStoredFiles } from "./images";
import { productCardSelect, publicProductWhere } from "./product-queries";
import { getSettings } from "./settings";

async function uniqueSlug(title: string) {
  // Latin-only slug part keeps URLs readable everywhere; Hebrew titles fall back to "item".
  const latin = slugify(title).replace(/[א-ת]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const base = latin.length >= 3 ? latin : "item";
  for (let i = 0; i < 5; i++) {
    const slug = `${base}-${randomSuffix(6)}`;
    const exists = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }
  return `${base}-${randomSuffix(12)}`;
}

async function assertCategory(categoryId: string) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) throw new ValidationError("הקטגוריה שנבחרה אינה קיימת");
  return category;
}

/**
 * Validates that every image id belongs to the user and is either pending
 * (not attached) or already attached to `productId`.
 */
async function assertImages(userId: string, imageIds: string[], productId: string | null) {
  const settings = await getSettings();
  if (imageIds.length > settings.maxImagesPerProduct) {
    throw new ValidationError(`ניתן להעלות עד ${settings.maxImagesPerProduct} תמונות`);
  }
  const images = await db.productImage.findMany({ where: { id: { in: imageIds } } });
  if (images.length !== imageIds.length) throw new ValidationError("חלק מהתמונות לא נמצאו. נסו להעלות שוב.");
  for (const img of images) {
    if (img.uploaderId !== userId) throw new ForbiddenError("אין הרשאה לתמונה");
    if (img.productId && img.productId !== productId) throw new ForbiddenError("אין הרשאה לתמונה");
  }
}

function imageOrdering(imageIds: string[], primaryImageId: string | null | undefined) {
  const primary = primaryImageId && imageIds.includes(primaryImageId) ? primaryImageId : imageIds[0];
  return imageIds.map((id, index) => ({ id, order: index, isPrimary: id === primary }));
}

async function attachImages(tx: Prisma.TransactionClient, productId: string, imageIds: string[], primaryImageId?: string | null) {
  for (const img of imageOrdering(imageIds, primaryImageId)) {
    await tx.productImage.update({
      where: { id: img.id },
      data: { productId, order: img.order, isPrimary: img.isPrimary },
    });
  }
}

async function runMatching(productId: string) {
  try {
    await matchProductToRequests(productId);
  } catch (e) {
    console.error("[matching] failed for product", productId, e);
  }
}

export async function createProduct(userId: string, input: ProductInput) {
  await assertCategory(input.categoryId);
  await assertImages(userId, input.imageIds, null);
  const region = regionForCity(input.city);
  if (!region) throw new ValidationError("עיר לא תקינה");
  const slug = await uniqueSlug(input.title);
  const now = new Date();

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        price: input.price,
        condition: input.condition,
        status: input.status,
        categoryId: input.categoryId,
        sellerId: userId,
        city: input.city,
        region,
        shippingAvailable: input.shippingAvailable,
        shippingPrice: input.shippingPrice,
        shippingDetails: input.shippingDetails,
        publishedAt: input.status === "ACTIVE" ? now : null,
      },
    });
    await attachImages(tx, created.id, input.imageIds, input.primaryImageId);
    return created;
  });

  if (product.status === "ACTIVE") await runMatching(product.id);
  return product;
}

async function getOwnedProduct(userId: string, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("המוצר לא נמצא");
  if (product.sellerId !== userId) throw new ForbiddenError();
  return product;
}

export async function updateProduct(userId: string, productId: string, input: ProductInput) {
  const existing = await getOwnedProduct(userId, productId);
  if (existing.status === "REMOVED") throw new ForbiddenError("המוצר הוסר על ידי הנהלת האתר ולא ניתן לערוך אותו");
  await assertCategory(input.categoryId);
  await assertImages(userId, input.imageIds, productId);
  const region = regionForCity(input.city);
  if (!region) throw new ValidationError("עיר לא תקינה");

  // Editing keeps SOLD / ARCHIVED status; DRAFT ↔ ACTIVE follows the form.
  const status: ProductStatus = existing.status === "ACTIVE" || existing.status === "DRAFT" ? input.status : existing.status;

  const removedImages = await db.productImage.findMany({
    where: { productId, id: { notIn: input.imageIds } },
    select: { id: true, storageKey: true },
  });

  const product = await db.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { id: { in: removedImages.map((i) => i.id) } } });
    await attachImages(tx, productId, input.imageIds, input.primaryImageId);
    return tx.product.update({
      where: { id: productId },
      data: {
        title: input.title,
        description: input.description,
        price: input.price,
        condition: input.condition,
        categoryId: input.categoryId,
        city: input.city,
        region,
        shippingAvailable: input.shippingAvailable,
        shippingPrice: input.shippingPrice,
        shippingDetails: input.shippingDetails,
        status,
        publishedAt: status === "ACTIVE" && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });
  });

  await deleteStoredFiles(removedImages.map((i) => i.storageKey));
  if (product.status === "ACTIVE") await runMatching(product.id);
  return product;
}

export async function setProductStatus(userId: string, productId: string, status: "ACTIVE" | "SOLD" | "ARCHIVED" | "DRAFT") {
  const existing = await getOwnedProduct(userId, productId);
  if (existing.status === "REMOVED") throw new ForbiddenError("המוצר הוסר על ידי הנהלת האתר");
  const product = await db.product.update({
    where: { id: productId },
    data: {
      status,
      soldAt: status === "SOLD" ? new Date() : null,
      publishedAt: status === "ACTIVE" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });
  if (status === "ACTIVE") await runMatching(productId);
  return product;
}

export async function deleteProduct(userId: string, productId: string) {
  const product = await getOwnedProduct(userId, productId);
  return hardDeleteProduct(product.id);
}

export async function hardDeleteProduct(productId: string) {
  const images = await db.productImage.findMany({ where: { productId }, select: { storageKey: true } });
  await db.product.delete({ where: { id: productId } });
  await deleteStoredFiles(images.map((i) => i.storageKey));
}

/** Product page data. Non-public products are visible only to the owner and admins. */
export async function getProductBySlug(slug: string, viewer: { id: string; role: string } | null) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      category: { select: { id: true, name: true, slug: true } },
      seller: {
        select: { id: true, name: true, avatarUrl: true, city: true, createdAt: true, status: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } },
      },
      _count: { select: { favorites: true } },
    },
  });
  if (!product) return null;
  const isOwner = viewer?.id === product.sellerId;
  const isAdmin = viewer?.role === "ADMIN";
  const publiclyVisible = (product.status === "ACTIVE" || product.status === "SOLD") && product.seller.status === "ACTIVE";
  if (!publiclyVisible && !isOwner && !isAdmin) return null;
  return { ...product, isOwner };
}

export async function incrementViewCount(productId: string) {
  await db.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
}

export async function getProductForEdit(userId: string, productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: [{ order: "asc" }] } },
  });
  if (!product) throw new NotFoundError("המוצר לא נמצא");
  if (product.sellerId !== userId) throw new ForbiddenError();
  return product;
}

export async function listUserProducts(userId: string, status?: ProductStatus) {
  return db.product.findMany({
    where: { sellerId: userId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      ...productCardSelect,
      viewCount: true,
      _count: { select: { favorites: true, conversations: true } },
    },
  });
}

export async function listLatestProducts(take = 8) {
  return db.product.findMany({
    where: publicProductWhere,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take,
    select: productCardSelect,
  });
}

export async function listFeaturedProducts(take = 8) {
  const featured = await db.product.findMany({
    where: { ...publicProductWhere, isFeatured: true },
    orderBy: [{ publishedAt: "desc" }],
    take,
    select: productCardSelect,
  });
  if (featured.length >= take) return featured;
  // Fallback: most viewed active products
  const more = await db.product.findMany({
    where: { ...publicProductWhere, isFeatured: false },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: take - featured.length,
    select: productCardSelect,
  });
  return [...featured, ...more];
}

export async function listSimilarProducts(product: { id: string; categoryId: string }, take = 4) {
  return db.product.findMany({
    where: { ...publicProductWhere, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { publishedAt: "desc" },
    take,
    select: productCardSelect,
  });
}

export async function listSellerOtherProducts(sellerId: string, excludeId: string, take = 4) {
  return db.product.findMany({
    where: { ...publicProductWhere, sellerId, id: { not: excludeId } },
    orderBy: { publishedAt: "desc" },
    take,
    select: productCardSelect,
  });
}
