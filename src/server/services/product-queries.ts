import type { Prisma } from "@prisma/client";

/** Shape needed to render a product card. Shared by search, home, favorites, dashboard. */
export const productCardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  condition: true,
  status: true,
  city: true,
  shippingAvailable: true,
  publishedAt: true,
  createdAt: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
    take: 1,
    select: { url: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

/** Products that buyers can see in public listings. */
export const publicProductWhere: Prisma.ProductWhereInput = {
  status: "ACTIVE",
  seller: { status: "ACTIVE" },
};
