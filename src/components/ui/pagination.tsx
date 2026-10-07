import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Server-rendered pagination that preserves the current query string. */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "page" || v === undefined) continue;
      (Array.isArray(v) ? v : [v]).forEach((val) => params.append(k, val));
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  const item = "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition-colors";
  return (
    <nav aria-label="עימוד" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "hover:bg-muted")} aria-label="לעמוד הקודם" rel="prev">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-stone-300")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-primary text-white" : "hover:bg-muted")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "hover:bg-muted")} aria-label="לעמוד הבא" rel="next">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-stone-300")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
    </nav>
  );
}
