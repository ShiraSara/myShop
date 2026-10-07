import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CalendarDays, Eye, Heart, MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { getProductBySlug, incrementViewCount, listSellerOtherProducts, listSimilarProducts } from "@/server/services/products";
import { favoriteIdsFor } from "@/server/services/favorites";
import { findBuyerConversation } from "@/server/services/messaging";
import { ProductGallery } from "@/components/product/product-gallery";
import { ContactSellerButton } from "@/components/product/contact-seller";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ShareButton } from "@/components/product/share-button";
import { ReportButton } from "@/components/product/report-button";
import { OwnerActions } from "@/components/product/owner-actions";
import { ConditionBadge } from "@/components/product/condition-badge";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CONDITION_LABELS, PRODUCT_STATUS_LABELS, SITE_NAME } from "@/lib/constants";
import { formatDate, formatNumber, formatPrice, siteUrl, timeAgo, truncate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

const loadProduct = cache(async (slug: string) => {
  const user = await getCurrentUser();
  const product = await getProductBySlug(slug, user);
  return { user, product };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await loadProduct(slug);
  if (!product) return { title: "המוצר לא נמצא" };
  const description = truncate(`${formatPrice(product.price)} · ${CONDITION_LABELS[product.condition]} · ${product.city}. ${product.description.replace(/\s+/g, " ")}`, 160);
  const image = product.images[0];
  return {
    title: `${product.title} — ${formatPrice(product.price)}`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    robots: product.status === "ACTIVE" || product.status === "SOLD" ? undefined : { index: false },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url: `/products/${product.slug}`,
      siteName: SITE_NAME,
      locale: "he_IL",
      images: image ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: product.title }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { user, product } = await loadProduct(slug);
  if (!product) notFound();

  const isOwner = product.isOwner;
  const [favorites, conversation, similar, sellerOther] = await Promise.all([
    favoriteIdsFor(user?.id, [product.id]),
    user && !isOwner ? findBuyerConversation(user.id, product.id) : null,
    listSimilarProducts(product),
    listSellerOtherProducts(product.sellerId, product.id),
    isOwner ? null : incrementViewCount(product.id),
  ]);
  const relatedFavs = await favoriteIdsFor(user?.id, [...similar, ...sellerOther].map((p) => p.id));
  const isActive = product.status === "ACTIVE";
  const isSold = product.status === "SOLD";
  const url = siteUrl(`/products/${product.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: truncate(product.description, 500),
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : siteUrl(i.url))),
    category: product.category.name,
    itemCondition:
      product.condition === "NEW" ? "https://schema.org/NewCondition" : product.condition === "NEEDS_REPAIR" ? "https://schema.org/DamagedCondition" : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ILS",
      price: product.price,
      availability: isActive ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: { "@type": "Person", name: product.seller.name },
      areaServed: product.city,
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "דף הבית", item: siteUrl("/") },
      { "@type": "ListItem", position: 2, name: product.category.name, item: siteUrl(`/categories/${product.category.slug}`) },
      { "@type": "ListItem", position: 3, name: product.title, item: url },
    ],
  };

  return (
    <div className="container-page pb-28 pt-6 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />

      <Breadcrumbs
        items={[
          { label: "דף הבית", href: "/" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
          { label: truncate(product.title, 40) },
        ]}
      />

      {!isActive && (
        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${isSold ? "bg-stone-900 text-white" : "bg-amber-50 text-amber-800"}`} role="status">
          {isSold ? "המוצר הזה כבר נמכר." : `סטטוס המודעה: ${PRODUCT_STATUS_LABELS[product.status]} — המודעה אינה מוצגת בתוצאות החיפוש.`}
          {product.status === "REMOVED" && product.removedReason ? ` סיבה: ${product.removedReason}` : null}
        </div>
      )}

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
        <ProductGallery images={product.images} title={product.title} sold={isSold} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ConditionBadge condition={product.condition} />
              {product.shippingAvailable && (
                <Badge tone="success"><Truck className="size-3.5" aria-hidden />משלוח אפשרי</Badge>
              )}
              {isSold && <Badge tone="dark">נמכר</Badge>}
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{product.title}</h1>
            <p className="text-3xl font-extrabold tracking-tight text-primary-700 sm:text-4xl">
              <span className="ltr-nums">{formatPrice(product.price)}</span>
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-muted/70 p-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4" aria-hidden />מיקום</dt>
              <dd className="mt-1 font-medium">{product.city}</dd>
            </div>
            <div className="rounded-2xl bg-muted/70 p-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground"><Package className="size-4" aria-hidden />מצב</dt>
              <dd className="mt-1 font-medium">{CONDITION_LABELS[product.condition]}</dd>
            </div>
            <div className="rounded-2xl bg-muted/70 p-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground"><Truck className="size-4" aria-hidden />משלוח</dt>
              <dd className="mt-1 font-medium">
                {product.shippingAvailable
                  ? product.shippingPrice
                    ? `כן, ${formatPrice(product.shippingPrice)}`
                    : product.shippingPrice === 0 ? "כן, חינם" : "כן"
                  : "איסוף עצמי בלבד"}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/70 p-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="size-4" aria-hidden />פורסם</dt>
              <dd className="mt-1 font-medium">
                <time dateTime={(product.publishedAt ?? product.createdAt).toISOString()} title={formatDate(product.publishedAt ?? product.createdAt)}>
                  {timeAgo(product.publishedAt ?? product.createdAt)}
                </time>
              </dd>
            </div>
          </dl>
          {product.shippingAvailable && product.shippingDetails && (
            <p className="-mt-3 rounded-2xl bg-green-50/70 p-3 text-sm text-green-900">{product.shippingDetails}</p>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            {isOwner ? (
              <OwnerActions productId={product.id} status={product.status} />
            ) : (
              <>
                <div className="hidden md:block">
                  {isActive && (
                    <ContactSellerButton
                      productId={product.id}
                      productTitle={product.title}
                      isLoggedIn={!!user}
                      existingConversationId={conversation?.id}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FavoriteButton productId={product.id} initialFavorited={favorites.has(product.id)} isLoggedIn={!!user} variant="button" />
                  <ShareButton title={product.title} url={url} />
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden />{formatNumber(product.viewCount)} צפיות</span>
                <span className="inline-flex items-center gap-1"><Heart className="size-3.5" aria-hidden />{formatNumber(product._count.favorites)} שמירות</span>
              </span>
              {!isOwner && <ReportButton productId={product.id} isLoggedIn={!!user} className="-me-2 h-8 text-xs" />}
            </div>
          </div>

          {/* Seller */}
          <section aria-labelledby="seller-heading" className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card">
            <h2 id="seller-heading" className="mb-3 text-sm font-medium text-muted-foreground">פרטי המוכר</h2>
            <div className="flex items-center gap-3">
              <Avatar name={product.seller.name} src={product.seller.avatarUrl} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product.seller.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.seller.city ? `${product.seller.city} · ` : ""}באתר מאז {new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(product.seller.createdAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{product.seller._count.products} מודעות</span>
            </div>
          </section>

          <div className="flex items-start gap-2.5 rounded-2xl bg-primary-50/70 p-3.5 text-sm text-primary-900">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="leading-relaxed">טיפ לקנייה בטוחה: היפגשו במקום ציבורי, בדקו את המוצר ושלמו רק לאחר שראיתם אותו.</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <section aria-labelledby="description-heading" className="mt-10 max-w-3xl">
        <h2 id="description-heading" className="mb-3 text-xl font-bold">תיאור</h2>
        <div className="whitespace-pre-line leading-relaxed text-stone-700">{product.description}</div>
        <p className="mt-4 text-sm text-muted-foreground">
          קטגוריה:{" "}
          <Link href={`/categories/${product.category.slug}`} className="font-medium text-primary hover:underline">{product.category.name}</Link>
        </p>
      </section>

      {sellerOther.length > 0 && (
        <section className="mt-14" aria-labelledby="seller-more">
          <h2 id="seller-more" className="mb-5 text-xl font-bold">עוד מהמוכר</h2>
          <ProductGrid products={sellerOther} favoriteIds={relatedFavs} isLoggedIn={!!user} />
        </section>
      )}
      {similar.length > 0 && (
        <section className="mt-14" aria-labelledby="similar">
          <h2 id="similar" className="mb-5 text-xl font-bold">מוצרים דומים</h2>
          <ProductGrid products={similar} favoriteIds={relatedFavs} isLoggedIn={!!user} />
        </section>
      )}

      {/* Mobile sticky CTA */}
      {!isOwner && isActive && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-xs text-muted-foreground">מחיר</p>
              <p className="text-lg font-extrabold leading-tight ltr-nums">{formatPrice(product.price)}</p>
            </div>
            <ContactSellerButton
              productId={product.id}
              productTitle={product.title}
              isLoggedIn={!!user}
              existingConversationId={conversation?.id}
              size="md"
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
