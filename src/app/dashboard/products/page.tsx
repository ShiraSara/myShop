import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ProductStatus } from "@prisma/client";
import { Eye, Heart, ImageOff, MessageCircle, Package, Plus } from "lucide-react";
import { requireUserPage } from "@/server/auth/guards";
import { listUserProducts } from "@/server/services/products";
import { OwnerActions } from "@/components/product/owner-actions";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { cn, formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "המוצרים שלי" };

const statusTone: Record<ProductStatus, BadgeTone> = { ACTIVE: "success", SOLD: "dark", DRAFT: "warning", ARCHIVED: "neutral", REMOVED: "danger" };
const TABS: { value?: ProductStatus; label: string }[] = [
  { label: "הכל" },
  { value: "ACTIVE", label: "פעילים" },
  { value: "SOLD", label: "נמכרו" },
  { value: "DRAFT", label: "טיוטות" },
  { value: "ARCHIVED", label: "ארכיון" },
];

export default async function MyProductsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUserPage("/dashboard/products");
  const { status: rawStatus } = await searchParams;
  const status = TABS.find((t) => t.value === rawStatus)?.value;
  const products = await listUserProducts(user.id, status);

  return (
    <div>
      <PageHeader title="המוצרים שלי" action={<ButtonLink href="/dashboard/products/new" className="rounded-full"><Plus />פרסום מוצר</ButtonLink>} />
      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="סינון לפי סטטוס">
        {TABS.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.label}
              href={t.value ? `/dashboard/products?status=${t.value}` : "/dashboard/products"}
              role="tab"
              aria-selected={active}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium transition", active ? "bg-stone-900 text-white" : "bg-surface ring-1 ring-border hover:bg-muted")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={status ? "אין מוצרים בסטטוס הזה" : "עוד לא פרסמת מוצרים"}
          description="מוצרים שתפרסמו יופיעו כאן, עם אפשרות לערוך, לסמן כנמכר ולמחוק."
          action={<ButtonLink href="/dashboard/products/new"><Plus />פרסום מוצר</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-3 shadow-card sm:flex-row sm:items-center sm:p-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Link href={`/products/${p.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                  {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="96px" className="object-cover" /> : <ImageOff className="m-auto mt-7 size-6 text-stone-400" aria-hidden />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[p.status]}>{PRODUCT_STATUS_LABELS[p.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                  </div>
                  <Link href={`/products/${p.slug}`} className="mt-1 block truncate font-semibold hover:text-primary">{p.title}</Link>
                  <p className="font-bold"><span className="ltr-nums">{formatPrice(p.price)}</span></p>
                  <p className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden />{p.viewCount}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5" aria-hidden />{p._count.favorites}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" aria-hidden />{p._count.conversations}</span>
                  </p>
                </div>
              </div>
              <OwnerActions productId={p.id} status={p.status} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
