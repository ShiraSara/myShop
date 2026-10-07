"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn("relative w-full", className)}>
      <label htmlFor="header-search" className="sr-only">חיפוש מוצרים</label>
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-[1.1rem] -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id="header-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="חיפוש מוצרים..."
        autoFocus={autoFocus}
        maxLength={100}
        className="h-11 w-full rounded-full border border-border bg-muted/60 ps-10 pe-4 text-[0.95rem] transition placeholder:text-stone-400 hover:border-stone-300 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
      />
    </form>
  );
}
