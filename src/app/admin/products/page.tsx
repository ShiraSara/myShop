import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import Image from "next/image";
import Link from "next/link";
import type { ProductStatus } from "@prisma/client";
import { adminListProducts } from "@/server/services/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th, FilterTabs } from "@/components/admin/table";
import { AdminSearch } from "@/components/admin/admin-search";
import { ProductAdminControls } from "@/components/admin/action-buttons";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "מוצרים" };
type SP = { q?: string; status?: string; page?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const status = sp.status && sp.status in PRODUCT_STATUS_LABELS ? (sp.status as ProductStatus) : undefined;
  const { items, total, page, pageCount } = await adminListProducts({ q: sp.q?.slice(0, 100), status, page: Number(sp.page) || 1 });
  return (
    <div>
      <PageHeader title="מוצרים" description={`${total} מוצרים`} />
      <FilterTabs basePath="/admin/products" active={status} tabs={[{ label: "הכל" }, ...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
      <AdminSearch placeholder="חיפוש לפי כותרת או אימייל מוכר" defaultValue={sp.q} hidden={{ status }} />
      <Table>
        <thead>
          <tr><Th>מוצר</Th><Th>מוכר</Th><Th>מחיר</Th><Th>סטטוס</Th><Th>דיווחים</Th><Th>פורסם</Th><Th>פעולות</Th></tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />}</span>
                  <div className="min-w-0">
                    <Link href={`/products/${p.slug}`} className="block max-w-56 truncate font-medium hover:text-primary">{p.title}</Link>
                    <p className="text-xs text-muted-foreground">{p.category.name} · {p.city}</p>
                  </div>
                </div>
              </Td>
              <Td><p>{p.seller.name}</p><p className="text-xs text-muted-foreground" dir="ltr">{p.seller.email}</p></Td>
              <Td><span className="ltr-nums">{formatPrice(p.price)}</span></Td>
              <Td><Badge tone={p.status === "ACTIVE" ? "success" : p.status === "REMOVED" ? "danger" : "neutral"}>{PRODUCT_STATUS_LABELS[p.status]}</Badge></Td>
              <Td>{p._count.reports > 0 ? <Badge tone="danger">{p._count.reports}</Badge> : "—"}</Td>
              <Td className="whitespace-nowrap">{timeAgo(p.createdAt)}</Td>
              <Td><ProductAdminControls productId={p.id} status={p.status} isFeatured={p.isFeatured} /></Td>
            </tr>
          ))}
          {items.length === 0 && <tr><Td className="py-10 text-center text-muted-foreground">לא נמצאו מוצרים</Td></tr>}
        </tbody>
      </Table>
      <Pagination page={page} pageCount={pageCount} basePath="/admin/products" searchParams={sp} />
    </div>
  );
}
