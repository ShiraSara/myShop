import type { Metadata } from "next";
import { Plus, Search, Sparkles } from "lucide-react";
import { requireUserPage } from "@/server/auth/guards";
import { listUserRequests } from "@/server/services/requests";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ProductCard } from "@/components/product/product-card";
import { RequestActions, DismissMatchButton } from "@/components/requests/request-actions";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { REGION_LABELS } from "@/lib/locations";
import { formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "בקשות המוצרים שלי" };

export default async function MyRequestsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const user = await requireUserPage("/dashboard/requests");
  const requests = await listUserRequests(user.id);
  const { created } = await searchParams;
  return (
    <div>
      <PageHeader title="בקשות המוצרים שלי" description="נעדכן אתכם כשיתפרסם מוצר שמתאים לבקשה" action={<ButtonLink href="/request-product" className="rounded-full"><Plus />בקשה חדשה</ButtonLink>} />
      {created && <Alert tone="success" className="mb-5">הבקשה פורסמה! נעדכן אתכם בכל התאמה חדשה.</Alert>}
      {requests.length === 0 ? (
        <EmptyState icon={Search} title="אין לכם בקשות" description="מחפשים משהו שלא מצאתם? פרסמו בקשה ונמצא לכם התאמות." action={<ButtonLink href="/request-product">פרסום בקשת מוצר</ButtonLink>} />
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.status === "OPEN" ? "success" : "neutral"}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold">{r.title}</h2>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                    {r.category && <span>{r.category.name}</span>}
                    {r.maxBudget !== null && <span>עד {formatPrice(r.maxBudget)}</span>}
                    {(r.city || r.region) && <span>{r.city ?? REGION_LABELS[r.region!]}</span>}
                    {r.shippingOk && <span>משלוח מתאים</span>}
                  </p>
                  {r.description && <p className="mt-2 text-sm text-stone-700">{r.description}</p>}
                </div>
                <RequestActions requestId={r.id} status={r.status} />
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="size-4 text-accent" aria-hidden />
                  {r._count.matches > 0 ? `${r._count.matches} מוצרים מתאימים` : "עדיין לא נמצאו התאמות"}
                </h3>
                {r.matches.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {r.matches.map((m) => (
                      <div key={m.id} className="relative">
                        <ProductCard product={m.product} showFavorite={false} isLoggedIn />
                        <DismissMatchButton matchId={m.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
