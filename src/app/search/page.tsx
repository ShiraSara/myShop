import type { Metadata } from "next";
import { Suspense } from "react";
import { parseSearchParams } from "@/lib/validation/search";
import { SearchResults } from "@/components/search/search-results";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { PageHeader } from "@/components/ui/page-header";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return {
    title: q ? `חיפוש: ${q}` : "חיפוש מוצרים",
    alternates: { canonical: "/search" },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  return (
    <div className="container-page py-8">
      <PageHeader title={filters.q ? <>תוצאות עבור <span className="text-primary">&quot;{filters.q}&quot;</span></> : "חיפוש מוצרים"} />
      <Suspense key={JSON.stringify(filters)} fallback={<ProductGridSkeleton />}>
        <SearchResults filters={filters} rawParams={raw} basePath="/search" showQuery />
      </Suspense>
    </div>
  );
}
