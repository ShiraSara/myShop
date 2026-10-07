import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", seller: { status: "ACTIVE" } },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 45000,
    }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: siteUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: siteUrl("/products"), changeFrequency: "hourly", priority: 0.9 },
    { url: siteUrl("/categories"), changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/request-product"), changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({ url: siteUrl(`/categories/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: siteUrl(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
