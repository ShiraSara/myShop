import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";

export async function listActiveCategoriesUncached() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, icon: true, description: true },
  });
}

/** Categories rarely change — cache for a minute, revalidated by admin edits via the "categories" tag. */
export const listActiveCategories = unstable_cache(listActiveCategoriesUncached, ["active-categories"], {
  revalidate: 60,
  tags: ["categories"],
});

export async function listCategoriesWithCounts() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
      _count: { select: { products: { where: { status: "ACTIVE", seller: { status: "ACTIVE" } } } } },
    },
  });
  return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findFirst({ where: { slug, isActive: true } });
}
