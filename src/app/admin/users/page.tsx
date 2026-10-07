import type { Metadata } from "next";
import type { UserStatus } from "@prisma/client";
import { adminListUsers } from "@/server/services/admin";
import { requireAdminPage } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th, FilterTabs } from "@/components/admin/table";
import { AdminSearch } from "@/components/admin/admin-search";
import { UserStatusButton } from "@/components/admin/action-buttons";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "משתמשים" };

type SP = { q?: string; status?: string; page?: string };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const status = sp.status === "ACTIVE" || sp.status === "BLOCKED" ? (sp.status as UserStatus) : undefined;
  const { items, total, page, pageCount } = await adminListUsers({ q: sp.q?.slice(0, 100), status, page: Number(sp.page) || 1 });
  return (
    <div>
      <PageHeader title="משתמשים" description={`${total} משתמשים`} />
      <FilterTabs basePath="/admin/users" active={status} tabs={[{ label: "הכל" }, { value: "ACTIVE", label: "פעילים" }, { value: "BLOCKED", label: "חסומים" }]} />
      <AdminSearch placeholder="חיפוש לפי שם או אימייל" defaultValue={sp.q} hidden={{ status }} />
      <Table>
        <thead>
          <tr><Th>משתמש</Th><Th>תפקיד</Th><Th>סטטוס</Th><Th>מוצרים</Th><Th>הצטרף</Th><Th>פעילות אחרונה</Th><Th /></tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <Td><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground" dir="ltr">{u.email}</p></Td>
              <Td>{u.role === "ADMIN" ? <Badge tone="primary">מנהל</Badge> : "משתמש"}</Td>
              <Td><Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status === "ACTIVE" ? "פעיל" : "חסום"}</Badge></Td>
              <Td>{u._count.products}</Td>
              <Td>{formatDate(u.createdAt)}</Td>
              <Td>{u.lastSeenAt ? timeAgo(u.lastSeenAt) : "—"}</Td>
              <Td className="text-end">{u.id !== admin.id && u.role !== "ADMIN" && <UserStatusButton userId={u.id} status={u.status} />}</Td>
            </tr>
          ))}
          {items.length === 0 && <tr><Td className="py-10 text-center text-muted-foreground">לא נמצאו משתמשים</Td></tr>}
        </tbody>
      </Table>
      <Pagination page={page} pageCount={pageCount} basePath="/admin/users" searchParams={sp} />
    </div>
  );
}
