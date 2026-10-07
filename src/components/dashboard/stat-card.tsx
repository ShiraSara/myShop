import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, href, hint }: { label: string; value: number; icon: LucideIcon; href?: string; hint?: string }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Icon className="size-[1.1rem]" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{formatNumber(value)}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-border/70 bg-surface p-4 shadow-card transition sm:p-5";
  return href ? (
    <Link href={href} className={`${cls} hover:-translate-y-0.5 hover:shadow-card-hover`}>{content}</Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}
