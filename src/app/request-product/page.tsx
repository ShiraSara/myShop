import type { Metadata } from "next";
import { BellRing, MessageCircle, Search } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveCategories } from "@/server/services/categories";
import { listRecentOpenRequests } from "@/server/services/requests";
import { RequestForm } from "@/components/forms/request-form";
import { ButtonLink } from "@/components/ui/button";
import { REGION_LABELS } from "@/lib/locations";
import { formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "בקשת מוצר — מחפשים משהו?",
  description: "לא מצאתם את מה שחיפשתם? פרסמו בקשת מוצר ונעדכן אתכם כשיתפרסם מוצר מתאים.",
  alternates: { canonical: "/request-product" },
};

export default async function RequestProductPage() {
  const [user, categories, recent] = await Promise.all([getCurrentUser(), listActiveCategories(), listRecentOpenRequests(6)]);
  return (
    <div className="container-page py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="mx-auto w-full max-w-2xl lg:mx-0">
          <p className="mb-2 text-sm font-semibold text-primary">מחפשים משהו?</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">לא מצאתם את מה שחיפשתם?</h1>
          <p className="mt-3 text-lg text-muted-foreground">ספרו לנו מה אתם מחפשים — ונעדכן אתכם ברגע שיתפרסם מוצר מתאים.</p>
          <div className="mt-8 rounded-3xl border border-border/70 bg-surface p-5 shadow-card sm:p-8">
            {user ? (
              <RequestForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
            ) : (
              <div className="py-6 text-center">
                <p className="text-lg font-semibold">כדי לפרסם בקשה צריך להתחבר</p>
                <p className="mt-1 text-muted-foreground">כך נוכל לעדכן אתכם כשנמצא התאמה.</p>
                <div className="mt-5 flex justify-center gap-2">
                  <ButtonLink href="/login?next=/request-product">התחברות</ButtonLink>
                  <ButtonLink href="/register?next=/request-product" variant="outline">הרשמה</ButtonLink>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-3xl bg-primary-50 p-6">
            <h2 className="font-semibold">איך זה עובד?</h2>
            <ol className="mt-4 space-y-4">
              {[
                { icon: Search, title: "מתארים מה מחפשים", text: "מוצר, תקציב, אזור והאם מתאים משלוח." },
                { icon: BellRing, title: "אנחנו מחפשים בשבילכם", text: "כל מוצר חדש נבדק מול הבקשה שלכם." },
                { icon: MessageCircle, title: "מקבלים התראה", text: "ומדברים עם המוכר ישירות באתר." },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-primary shadow-sm"><Icon className="size-4" aria-hidden /></span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {recent.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold">בקשות אחרונות</h2>
              <ul className="space-y-2">
                {recent.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border/70 bg-surface p-3.5 text-sm">
                    <p className="font-medium">{r.title}</p>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      {r.maxBudget && <span>עד {formatPrice(r.maxBudget)}</span>}
                      {(r.city || r.region) && <span>· {r.city ?? REGION_LABELS[r.region!]}</span>}
                      <span>· {timeAgo(r.createdAt)}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">יש לכם מוצר שמתאים? <a href="/dashboard/products/new" className="font-medium text-primary hover:underline">פרסמו אותו</a></p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
