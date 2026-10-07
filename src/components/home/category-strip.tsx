import Link from "next/link";
import { CategoryIcon } from "@/components/ui/dynamic-icon";

export function CategoryStrip({ categories }: { categories: { id: string; name: string; slug: string; icon: string }[] }) {
  return (
    <ul className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
      {categories.map((c) => (
        <li key={c.id} className="shrink-0">
          <Link
            href={`/categories/${c.slug}`}
            className="group flex w-24 flex-col items-center gap-2.5 rounded-2xl border border-border/70 bg-surface px-2 py-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover sm:w-auto"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary group-hover:text-white">
              <CategoryIcon name={c.icon} className="size-6" />
            </span>
            <span className="text-sm font-medium leading-tight">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
