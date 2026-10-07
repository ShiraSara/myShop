import { cn } from "@/lib/utils";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border/70 bg-surface shadow-card", className)}>
      <table className="w-full min-w-[44rem] text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("border-b border-border bg-muted/50 px-4 py-3 text-start text-xs font-semibold text-muted-foreground", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-border/70 px-4 py-3 align-middle", className)}>{children}</td>;
}

export function FilterTabs({ tabs, active, basePath, param = "status" }: { tabs: { value?: string; label: string }[]; active?: string; basePath: string; param?: string }) {
  return (
    <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
      {tabs.map((t) => (
        <a
          key={t.label}
          href={t.value ? `${basePath}?${param}=${t.value}` : basePath}
          aria-current={t.value === active ? "page" : undefined}
          className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium transition", t.value === active ? "bg-stone-900 text-white" : "bg-surface ring-1 ring-border hover:bg-muted")}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
