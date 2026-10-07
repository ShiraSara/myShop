import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import Link from "next/link";
import type { ReportStatus } from "@prisma/client";
import { Flag } from "lucide-react";
import { adminListReports } from "@/server/services/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterTabs } from "@/components/admin/table";
import { ReportControls } from "@/components/admin/action-buttons";
import { PRODUCT_STATUS_LABELS, REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "דיווחים" };
type SP = { status?: string; page?: string };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const status = sp.status && sp.status in REPORT_STATUS_LABELS ? (sp.status as ReportStatus) : undefined;
  const { items, total, page, pageCount } = await adminListReports({ status, page: Number(sp.page) || 1 });
  return (
    <div>
      <PageHeader title="דיווחים" description={`${total} דיווחים`} />
      <FilterTabs basePath="/admin/reports" active={status} tabs={[{ label: "הכל" }, ...Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
      {items.length === 0 ? (
        <EmptyState icon={Flag} title="אין דיווחים" description="כל הכבוד — אין דיווחים שממתינים לטיפול." />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.status === "OPEN" ? "danger" : "neutral"}>{REPORT_STATUS_LABELS[r.status]}</Badge>
                    <Badge tone="warning">{REPORT_REASON_LABELS[r.reason]}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-2">
                    <Link href={`/products/${r.product.slug}`} className="font-semibold hover:text-primary">{r.product.title}</Link>{" "}
                    <span className="text-xs text-muted-foreground">({PRODUCT_STATUS_LABELS[r.product.status]}) · מוכר: {r.product.seller.name}</span>
                  </p>
                  {r.details && <p className="mt-1 text-sm text-stone-700">&ldquo;{r.details}&rdquo;</p>}
                  <p className="mt-1 text-xs text-muted-foreground">דווח על ידי {r.reporter.name}{r.resolvedBy ? ` · טופל על ידי ${r.resolvedBy.name}` : ""}</p>
                </div>
                {r.status === "OPEN" && <ReportControls reportId={r.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} basePath="/admin/reports" searchParams={sp} />
    </div>
  );
}
