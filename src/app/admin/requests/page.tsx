import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import type { RequestStatus } from "@prisma/client";
import { adminListRequests } from "@/server/services/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th, FilterTabs } from "@/components/admin/table";
import { RequestStatusSelect } from "@/components/admin/action-buttons";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { REGION_LABELS } from "@/lib/locations";
import { formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "בקשות מוצרים" };
type SP = { status?: string; page?: string };

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const status = sp.status && sp.status in REQUEST_STATUS_LABELS ? (sp.status as RequestStatus) : undefined;
  const { items, total, page, pageCount } = await adminListRequests({ status, page: Number(sp.page) || 1 });
  return (
    <div>
      <PageHeader title="בקשות מוצרים" description={`${total} בקשות`} />
      <FilterTabs basePath="/admin/requests" active={status} tabs={[{ label: "הכל" }, ...Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
      <Table>
        <thead>
          <tr><Th>בקשה</Th><Th>משתמש</Th><Th>תקציב</Th><Th>מיקום</Th><Th>התאמות</Th><Th>נוצרה</Th><Th>סטטוס</Th></tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <Td><p className="font-medium">{r.title}</p>{r.category && <p className="text-xs text-muted-foreground">{r.category.name}</p>}<p className="text-xs text-muted-foreground" dir="ltr">{r.keywords.join(", ")}</p></Td>
              <Td><p>{r.user.name}</p><p className="text-xs text-muted-foreground" dir="ltr">{r.user.email}</p></Td>
              <Td>{r.maxBudget !== null ? formatPrice(r.maxBudget) : "—"}</Td>
              <Td>{r.city ?? (r.region ? REGION_LABELS[r.region] : "כל הארץ")}{r.shippingOk && <span className="block text-xs text-muted-foreground">משלוח מתאים</span>}</Td>
              <Td>{r._count.matches}</Td>
              <Td className="whitespace-nowrap">{timeAgo(r.createdAt)}</Td>
              <Td><RequestStatusSelect requestId={r.id} status={r.status} /></Td>
            </tr>
          ))}
          {items.length === 0 && <tr><Td className="py-10 text-center text-muted-foreground">אין בקשות</Td></tr>}
        </tbody>
      </Table>
      <Pagination page={page} pageCount={pageCount} basePath="/admin/requests" searchParams={sp} />
    </div>
  );
}
