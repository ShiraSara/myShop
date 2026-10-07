import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategoryBySlug } from "@/server/services/categories";
import { parseSearchParams } from "@/lib/validation/search";
import { SearchResults } from "@/components/search/search-results";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CategoryIcon } from "@/components/ui/dynamic-icon";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "קטגוריה לא נמצאה" };
  return {
    title: `${category.name} — יד שנייה וחדש`,
    description: category.description ?? `${category.name} למכירה: מוצרים חדשים ויד שנייה בכל הארץ.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "דף הבית", href: "/" }, { label: "קטגוריות", href: "/categories" }, { label: category.name }]} />
      <PageHeader
        className="mt-4"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <CategoryIcon name={category.icon} className="size-6" />
            </span>
            {category.name}
          </span>
        }
        description={category.description}
      />
      <Suspense key={JSON.stringify(filters)} fallback={<ProductGridSkeleton />}>
        <SearchResults filters={filters} rawParams={raw} basePath={`/categories/${category.slug}`} fixedCategory={category.slug} showQuery />
      </Suspense>
    </div>
  );
}
