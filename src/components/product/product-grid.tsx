import type { ProductCardData } from "@/server/services/product-queries";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductGrid({
  products,
  favoriteIds,
  isLoggedIn,
  className,
  priorityCount = 0,
  showFavorite = true,
}: {
  products: ProductCardData[];
  favoriteIds?: Set<string>;
  isLoggedIn: boolean;
  className?: string;
  priorityCount?: number;
  showFavorite?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} favorited={favoriteIds?.has(p.id)} isLoggedIn={isLoggedIn} priority={i < priorityCount} showFavorite={showFavorite} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)} aria-busy="true" aria-label="טוען מוצרים">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-3.5">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
