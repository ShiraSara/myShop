import { Search } from "lucide-react";

/** Plain GET form — works without JS. */
export function AdminSearch({ placeholder, defaultValue, hidden }: { placeholder: string; defaultValue?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form method="get" className="relative mb-4 max-w-sm" role="search">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor="admin-q" className="sr-only">{placeholder}</label>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input id="admin-q" name="q" defaultValue={defaultValue} placeholder={placeholder} className="h-10 w-full rounded-xl border border-border bg-surface ps-9 pe-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
    </form>
  );
}
