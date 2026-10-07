import type { Metadata } from "next";
import { Suspense } from "react";
import { parseSearchParams } from "@/lib/validation/search";
import { SearchResults } from "@/components/search/search-results";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "כל המוצרים",
  description: "כל המוצרים שפורסמו למכירה — סננו לפי קטגוריה, עיר, מחיר ומצב.",
  alternates: { canonical: "/products" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProductsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "דף הבית", href: "/" }, { label: "כל המוצרים" }]} />
      <PageHeader title="כל המוצרים" description="מוצרים חדשים ויד שנייה מכל הארץ" className="mt-4" />
      <Suspense key={JSON.stringify(filters)} fallback={<ProductGridSkeleton />}>
        <SearchResults filters={filters} rawParams={raw} basePath="/products" showQuery />
      </Suspense>
    </div>
  );
}
