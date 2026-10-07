import Link from "next/link";
import { SearchX, X } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveCategories } from "@/server/services/categories";
import { favoriteIdsFor } from "@/server/services/favorites";
import { searchProducts } from "@/server/services/search";
import type { SearchFilters } from "@/lib/validation/search";
import { CONDITION_LABELS } from "@/lib/constants";
import { REGION_LABELS } from "@/lib/locations";
import { formatNumber, formatPrice } from "@/lib/utils";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { FiltersSidebar, MobileFilters, SortSelect } from "./filters";

/** Shared results view for /products, /search and /categories/[slug]. */
export async function SearchResults({
  filters,
  rawParams,
  basePath,
  fixedCategory,
  showQuery,
}: {
  filters: SearchFilters;
  rawParams: Record<string, string | string[] | undefined>;
  basePath: string;
  fixedCategory?: string;
  showQuery?: boolean;
}) {
  const [user, categories, result] = await Promise.all([
    getCurrentUser(),
    listActiveCategories(),
    searchProducts(fixedCategory ? { ...filters, category: fixedCategory } : filters),
  ]);
  const favoriteIds = await favoriteIdsFor(user?.id, result.items.map((p) => p.id));
  const categoryOptions = categories.map((c) => ({ slug: c.slug, name: c.name }));

  // Active filter chips
  const chips: { label: string; remove: string }[] = [];
  const without = (...keys: string[]) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(rawParams)) {
      if (keys.includes(k) || k === "page" || v === undefined) continue;
      (Array.isArray(v) ? v : [v]).forEach((val) => p.append(k, val));
    }
    return p.size ? `${basePath}?${p}` : basePath;
  };
  if (filters.q && showQuery) chips.push({ label: `"${filters.q}"`, remove: without("q") });
  if (filters.category && !fixedCategory) chips.push({ label: categories.find((c) => c.slug === filters.category)?.name ?? filters.category, remove: without("category") });
  if (filters.region) chips.push({ label: REGION_LABELS[filters.region as keyof typeof REGION_LABELS], remove: without("region", "city") });
  if (filters.city) chips.push({ label: filters.city, remove: without("city") });
  if (filters.minPrice !== undefined) chips.push({ label: `מ-${formatPrice(filters.minPrice)}`, remove: without("minPrice") });
  if (filters.maxPrice !== undefined) chips.push({ label: `עד ${formatPrice(filters.maxPrice)}`, remove: without("maxPrice") });
  if (filters.condition?.length) chips.push({ label: filters.condition.map((c) => CONDITION_LABELS[c]).join(", "), remove: without("condition") });
  if (filters.shipping) chips.push({ label: "עם משלוח", remove: without("shipping") });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <FiltersSidebar categories={categoryOptions} fixedCategory={fixedCategory} showQuery={showQuery} />
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">{formatNumber(result.total)}</span> מוצרים
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters categories={categoryOptions} fixedCategory={fixedCategory} showQuery={showQuery} activeCount={chips.length} />
            <SortSelect fixedCategory={fixedCategory} />
          </div>
        </div>
        {chips.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2" aria-label="סינונים פעילים">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Link href={chip.remove} scroll={false} className="inline-flex items-center gap-1 rounded-full bg-primary-50 py-1 pe-2 ps-3 text-sm text-primary-800 transition hover:bg-primary-100" aria-label={`הסרת סינון ${chip.label}`}>
                  {chip.label}
                  <X className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link href={filters.q && showQuery ? `${basePath}?q=${encodeURIComponent(filters.q)}` : basePath} scroll={false} className="inline-flex px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
                ניקוי הכל
              </Link>
            </li>
          </ul>
        )}

        {result.items.length > 0 ? (
          <>
            <ProductGrid products={result.items} favoriteIds={favoriteIds} isLoggedIn={!!user} className="md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4" priorityCount={4} />
            <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} searchParams={rawParams} />
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title="לא מצאנו מוצרים מתאימים"
            description="נסו לשנות את מילות החיפוש או להסיר חלק מהסינונים. ואפשר גם לפרסם בקשה — ונעדכן אתכם כשיופיע מוצר מתאים."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink href="/request-product">פרסום בקשת מוצר</ButtonLink>
                <ButtonLink href={basePath} variant="outline">ניקוי סינונים</ButtonLink>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
