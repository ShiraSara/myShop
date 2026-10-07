"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { SheetContent } from "@/components/ui/dialog";
import { CONDITIONS, SORT_OPTIONS } from "@/lib/constants";
import { CITIES, REGIONS } from "@/lib/locations";

type Category = { slug: string; name: string };

type FilterState = {
  q: string;
  category: string;
  region: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  condition: string[];
  shipping: boolean;
};

function readState(params: URLSearchParams, fixedCategory?: string): FilterState {
  return {
    q: params.get("q") ?? "",
    category: fixedCategory ?? params.get("category") ?? "",
    region: params.get("region") ?? "",
    city: params.get("city") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    condition: params.getAll("condition").flatMap((c) => c.split(",")).filter(Boolean),
    shipping: params.get("shipping") === "1",
  };
}

function useApply(fixedCategory?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  function apply(state: Partial<FilterState> & { sort?: string }) {
    const next = new URLSearchParams();
    const merged = { ...readState(params, fixedCategory), sort: params.get("sort") ?? "", ...state };
    if (merged.q) next.set("q", merged.q);
    if (merged.category && !fixedCategory) next.set("category", merged.category);
    if (merged.region) next.set("region", merged.region);
    if (merged.city) next.set("city", merged.city);
    if (merged.minPrice) next.set("minPrice", merged.minPrice);
    if (merged.maxPrice) next.set("maxPrice", merged.maxPrice);
    if (merged.condition.length) next.set("condition", merged.condition.join(","));
    if (merged.shipping) next.set("shipping", "1");
    if (merged.sort && merged.sort !== "newest") next.set("sort", merged.sort);
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }
  return { apply, pending, params };
}

function FilterForm({ categories, fixedCategory, onDone, showQuery }: { categories: Category[]; fixedCategory?: string; onDone?: () => void; showQuery?: boolean }) {
  const { apply, pending, params } = useApply(fixedCategory);
  const [state, setState] = useState<FilterState>(() => readState(params, fixedCategory));
  useEffect(() => setState(readState(params, fixedCategory)), [params, fixedCategory]);

  const cities = state.region ? CITIES.filter((c) => c.region === state.region) : CITIES;
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) => setState((s) => ({ ...s, [key]: value }));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply(state);
        onDone?.();
      }}
    >
      {showQuery && (
        <div className="space-y-1.5">
          <label htmlFor="f-q" className="text-sm font-medium">מילות חיפוש</label>
          <Input id="f-q" value={state.q} onChange={(e) => set("q", e.target.value)} placeholder="לדוגמה: אופניים" maxLength={100} />
        </div>
      )}
      {!fixedCategory && (
        <div className="space-y-1.5">
          <label htmlFor="f-category" className="text-sm font-medium">קטגוריה</label>
          <Select id="f-category" value={state.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="f-region" className="text-sm font-medium">אזור</label>
        <Select id="f-region" value={state.region} onChange={(e) => setState((s) => ({ ...s, region: e.target.value, city: "" }))}>
          <option value="">כל הארץ</option>
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="f-city" className="text-sm font-medium">עיר</label>
        <Select id="f-city" value={state.city} onChange={(e) => set("city", e.target.value)}>
          <option value="">כל הערים</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </Select>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">מחיר (₪)</legend>
        <div className="flex items-center gap-2">
          <Input type="number" inputMode="numeric" min={0} aria-label="מחיר מינימלי" placeholder="מ-" value={state.minPrice} onChange={(e) => set("minPrice", e.target.value)} />
          <span className="text-muted-foreground" aria-hidden>–</span>
          <Input type="number" inputMode="numeric" min={0} aria-label="מחיר מקסימלי" placeholder="עד" value={state.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">מצב המוצר</legend>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const active = state.condition.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                onClick={() => set("condition", active ? state.condition.filter((v) => v !== c.value) : [...state.condition, c.value])}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary-50 font-medium text-primary-700" : "border-border bg-surface hover:border-stone-300"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-3">
        <span className="text-sm font-medium">רק מוצרים עם משלוח</span>
        <input type="checkbox" className="size-5 accent-primary-600" checked={state.shipping} onChange={(e) => set("shipping", e.target.checked)} />
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1" loading={pending}>הצגת תוצאות</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const cleared: FilterState = { q: state.q, category: "", region: "", city: "", minPrice: "", maxPrice: "", condition: [], shipping: false };
            setState(cleared);
            apply(cleared);
            onDone?.();
          }}
        >
          ניקוי
        </Button>
      </div>
    </form>
  );
}

export function FiltersSidebar(props: { categories: Category[]; fixedCategory?: string; showQuery?: boolean }) {
  return (
    <aside className="hidden lg:block" aria-label="סינון תוצאות">
      <div className="sticky top-24 rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
        <h2 className="mb-4 font-semibold">סינון</h2>
        <FilterForm {...props} />
      </div>
    </aside>
  );
}

export function MobileFilters(props: { categories: Category[]; fixedCategory?: string; showQuery?: boolean; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className="h-10 rounded-full lg:hidden">
          <SlidersHorizontal />
          סינון
          {props.activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-white">{props.activeCount}</span>}
        </Button>
      </DialogPrimitive.Trigger>
      <SheetContent title="סינון תוצאות">
        <div className="p-5">
          <FilterForm {...props} onDone={() => setOpen(false)} />
        </div>
      </SheetContent>
    </DialogPrimitive.Root>
  );
}

export function SortSelect({ fixedCategory }: { fixedCategory?: string }) {
  const { apply, params } = useApply(fixedCategory);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="hidden text-sm text-muted-foreground sm:block">מיון:</label>
      <Select id="sort" value={params.get("sort") ?? "newest"} onChange={(e) => apply({ sort: e.target.value })} className="h-10 w-auto min-w-44 rounded-full text-sm">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    </div>
  );
}
