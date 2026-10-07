import type { Metadata } from "next";
import { CircleCheck, Eye, Heart, MessageCircle, Package, PackageCheck, Plus, Search } from "lucide-react";
import { requireUserPage } from "@/server/auth/guards";
import { getSellerStats } from "@/server/services/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "האזור האישי" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const user = await requireUserPage("/dashboard");
  const stats = await getSellerStats(user.id);
  const { reset } = await searchParams;

  return (
    <div className="space-y-8">
      {reset && <Alert tone="success">הסיסמה עודכנה בהצלחה.</Alert>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">שלום, {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-muted-foreground">הנה מה שקורה עם המודעות שלך</p>
        </div>
        <ButtonLink href="/dashboard/products/new" className="rounded-full"><Plus />פרסום מוצר</ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="סה״כ מוצרים" value={stats.totalProducts} icon={Package} href="/dashboard/products" hint={stats.draftProducts ? `${stats.draftProducts} טיוטות` : undefined} />
        <StatCard label="מוצרים פעילים" value={stats.activeProducts} icon={CircleCheck} href="/dashboard/products?status=ACTIVE" />
        <StatCard label="נמכרו" value={stats.soldProducts} icon={PackageCheck} href="/dashboard/products?status=SOLD" />
        <StatCard label="שיחות" value={stats.conversations} icon={MessageCircle} href="/dashboard/messages" hint={stats.unreadMessages ? `${stats.unreadMessages} הודעות שלא נקראו` : undefined} />
        <StatCard label="שמירות למוצרים שלי" value={stats.favoritesReceived} icon={Heart} />
        <StatCard label="צפיות במודעות" value={stats.totalViews} icon={Eye} />
        <StatCard label="מוצרים ששמרתי" value={stats.favoritesSaved} icon={Heart} href="/dashboard/favorites" />
        <StatCard label="בקשות פתוחות" value={stats.openRequests} icon={Search} href="/dashboard/requests" />
      </div>

      <section aria-labelledby="recent-products">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-products" className="text-lg font-semibold">מוצרים אחרונים</h2>
          {stats.recentProducts.length > 0 && <ButtonLink href="/dashboard/products" variant="link" size="sm">לכל המוצרים</ButtonLink>}
        </div>
        {stats.recentProducts.length ? (
          <ProductGrid products={stats.recentProducts} isLoggedIn showFavorite={false} className="lg:grid-cols-4" />
        ) : (
          <EmptyState icon={Package} title="עוד לא פרסמת מוצרים" description="יש לך משהו שכבר לא בשימוש? פרסמו אותו תוך דקה." action={<ButtonLink href="/dashboard/products/new"><Plus />פרסום מוצר ראשון</ButtonLink>} />
        )}
      </section>
    </div>
  );
}
