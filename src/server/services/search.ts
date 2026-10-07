import "server-only";
import type { Prisma } from "@prisma/client";
import { PAGE_SIZE } from "@/lib/constants";
import { tokenize } from "@/lib/keywords";
import type { SearchFilters } from "@/lib/validation/search";
import { db } from "../db";
import { productCardSelect, publicProductWhere, type ProductCardData } from "./product-queries";

export type SearchResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

/** Light Hebrew normalisation: "הספה" → "ספה", "אופניים" → "אופני", "כיסאות" → "כיסא". */
export function searchVariants(word: string): string[] {
  const out = new Set([word]);
  if (/^[\u05D0-\u05EA]+$/.test(word)) {
    if (word.length >= 4 && "הובל".includes(word[0])) out.add(word.slice(1));
    if (word.length >= 5 && /(ים|ות)$/.test(word)) out.add(word.slice(0, -2));
  }
  return [...out];
}

/**
 * Builds the Prisma filter for a search. Text search uses ILIKE on title /
 * description / category (backed by pg_trgm GIN indexes). Each word must match
 * somewhere (AND semantics). Swap this function for full-text / vector search later.
 */
export function buildSearchWhere(filters: Partial<SearchFilters>): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [publicProductWhere];

  const words = filters.q ? tokenize(filters.q).filter((w) => w.length >= 2).slice(0, 6) : [];
  for (const word of words) {
    and.push({
      OR: searchVariants(word).flatMap((v) => [
        { title: { contains: v, mode: "insensitive" as const } },
        { description: { contains: v, mode: "insensitive" as const } },
        { category: { name: { contains: v, mode: "insensitive" as const } } },
      ]),
    });
  }
  if (filters.category) and.push({ category: { slug: filters.category } });
  if (filters.city) and.push({ city: filters.city });
  if (filters.region) and.push({ region: filters.region as Prisma.EnumRegionFilter["equals"] });
  if (filters.condition?.length) and.push({ condition: { in: filters.condition } });
  if (filters.shipping) and.push({ shippingAvailable: true });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    let { minPrice, maxPrice } = filters;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
    and.push({ price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } });
  }
  return { AND: and };
}

function orderBy(sort: SearchFilters["sort"] | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { publishedAt: "desc" }, { id: "asc" }];
    case "price_desc":
      return [{ price: "desc" }, { publishedAt: "desc" }, { id: "asc" }];
    default:
      return [{ publishedAt: "desc" }, { id: "desc" }];
  }
}

export async function searchProducts(filters: Partial<SearchFilters>, pageSize = PAGE_SIZE): Promise<SearchResult> {
  const where = buildSearchWhere(filters);
  const page = Math.max(1, filters.page ?? 1);
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: orderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: productCardSelect,
    }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)), pageSize };
}
