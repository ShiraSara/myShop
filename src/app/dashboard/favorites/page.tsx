import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUserPage } from "@/server/auth/guards";
import { listFavorites } from "@/server/services/favorites";
import { ProductGrid } from "@/components/product/product-grid";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "מועדפים" };

export default async function FavoritesPage() {
  const user = await requireUserPage("/dashboard/favorites");
  const products = await listFavorites(user.id);
  return (
    <div>
      <PageHeader title="מועדפים" description={products.length ? `${products.length} מוצרים שמורים` : undefined} />
      {products.length ? (
        <ProductGrid products={products} favoriteIds={new Set(products.map((p) => p.id))} isLoggedIn className="lg:grid-cols-3 xl:grid-cols-4" />
      ) : (
        <EmptyState
          icon={Heart}
          title="אין עדיין מועדפים"
          description="לחצו על ♡ במוצר שאהבתם כדי לשמור אותו כאן ולחזור אליו בקלות."
          action={<ButtonLink href="/products">גלישה במוצרים</ButtonLink>}
        />
      )}
    </div>
  );
}
