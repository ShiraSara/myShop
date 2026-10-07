import Image from "next/image";
import Link from "next/link";
import { Clock, ImageOff, MapPin, Truck } from "lucide-react";
import type { ProductCardData } from "@/server/services/product-queries";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { ConditionBadge } from "./condition-badge";
import { FavoriteButton } from "./favorite-button";

export function ProductCard({
  product,
  favorited = false,
  isLoggedIn = false,
  showFavorite = true,
  priority = false,
  className,
}: {
  product: ProductCardData;
  favorited?: boolean;
  isLoggedIn?: boolean;
  showFavorite?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const image = product.images[0];
  const sold = product.status === "SOLD";
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", sold && "grayscale-[60%]")}
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        <div className="absolute start-2.5 top-2.5 flex gap-1.5">
          <ConditionBadge condition={product.condition} overlay />
          {sold && <span className="rounded-full bg-stone-900/85 px-2.5 py-0.5 text-xs font-medium text-white">נמכר</span>}
        </div>
        {showFavorite && (
          <FavoriteButton productId={product.id} initialFavorited={favorited} isLoggedIn={isLoggedIn} className="absolute end-2.5 top-2.5 z-10" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <p className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          <span className="ltr-nums">{formatPrice(product.price)}</span>
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-stone-700 sm:text-[0.95rem]">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.title}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {product.city}
          </span>
          {product.shippingAvailable && (
            <span className="inline-flex items-center gap-1 text-primary-700">
              <Truck className="size-3.5" aria-hidden />
              משלוח
            </span>
          )}
          <span className="inline-flex items-center gap-1 ms-auto">
            <Clock className="size-3.5" aria-hidden />
            <time dateTime={(product.publishedAt ?? product.createdAt).toISOString()}>{timeAgo(product.publishedAt ?? product.createdAt)}</time>
          </span>
        </div>
      </div>
    </article>
  );
}
