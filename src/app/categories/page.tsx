import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesWithCounts } from "@/server/services/categories";
import { CategoryIcon } from "@/components/ui/dynamic-icon";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "קטגוריות",
  description: "כל הקטגוריות: אלקטרוניקה, ריהוט, אופניים, אופנה, ילדים ועוד.",
  alternates: { canonical: "/categories" },
};

export const revalidate = 300;

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "דף הבית", href: "/" }, { label: "קטגוריות" }]} />
      <PageHeader title="קטגוריות" description="בחרו קטגוריה כדי לראות את כל המוצרים בה" className="mt-4" />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categories/${c.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary group-hover:text-white">
                <CategoryIcon name={c.icon} className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{c.name}</span>
                {c.description && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{c.description}</span>}
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{formatNumber(c.productCount)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
