import Link from "next/link";
import { HandHelping, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveCategories } from "@/server/services/categories";
import { listFeaturedProducts, listLatestProducts } from "@/server/services/products";
import { favoriteIdsFor } from "@/server/services/favorites";
import { HeroSearch } from "@/components/home/hero-search";
import { Section } from "@/components/home/section";
import { CategoryStrip } from "@/components/home/category-strip";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SITE_NAME } from "@/lib/constants";
import { siteUrl } from "@/lib/utils";


export default async function HomePage() {
  const [user, categories, latest, featured] = await Promise.all([
    getCurrentUser(),
    listActiveCategories(),
    listLatestProducts(8),
    listFeaturedProducts(4),
  ]);
  const favoriteIds = await favoriteIdsFor(user?.id, [...latest, ...featured].map((p) => p.id));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    potentialAction: { "@type": "SearchAction", target: `${siteUrl("/search")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary-50 via-primary-50/40 to-background">
        <div aria-hidden className="pointer-events-none absolute -top-40 start-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary-200/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -end-20 size-80 rounded-full bg-accent-100/50 blur-3xl" />
        <div className="container-page relative py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 text-sm font-medium text-primary-700 shadow-sm ring-1 ring-primary-100">
              <Sparkles className="size-4" aria-hidden />
              אלפי מוצרים מאנשים קרובים אליכם
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">מצאו את מה שחיפשתם.</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              קונים ומוכרים מוצרים חדשים ויד שנייה — בקלות, בביטחון ובלי עמלות.
            </p>
            <div className="mx-auto mt-8 max-w-2xl">
              <HeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <Section title="קטגוריות פופולריות" href="/categories" linkLabel="לכל הקטגוריות" id="home-categories">
        <CategoryStrip categories={categories.slice(0, 8)} />
      </Section>

      {/* New products */}
      <Section title="מוצרים חדשים" href="/products" id="home-latest">
        {latest.length ? (
          <ProductGrid products={latest} favoriteIds={favoriteIds} isLoggedIn={!!user} priorityCount={4} />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="עדיין אין מוצרים באתר"
            description="היו הראשונים לפרסם מוצר — זה לוקח פחות מדקה."
            action={<ButtonLink href="/dashboard/products/new">פרסום מוצר</ButtonLink>}
          />
        )}
      </Section>

      {/* Featured */}
      {featured.length > 0 && (
        <Section title="מוצרים מומלצים" href="/products" id="home-featured">
          <ProductGrid products={featured} favoriteIds={favoriteIds} isLoggedIn={!!user} />
        </Section>
      )}

      {/* Request CTA */}
      <section className="container-page mt-16" aria-labelledby="home-request">
        <div className="relative overflow-hidden rounded-3xl bg-primary-800 px-6 py-10 text-white sm:px-12 sm:py-14">
          <div aria-hidden className="absolute -end-16 -top-16 size-64 rounded-full bg-primary-600/50 blur-2xl" />
          <div aria-hidden className="absolute -bottom-24 start-1/3 size-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/10">
                <HandHelping className="size-6" aria-hidden />
              </span>
              <h2 id="home-request" className="text-2xl font-bold sm:text-3xl">לא מצאתם?</h2>
              <p className="mt-2 text-lg leading-relaxed text-primary-100">
                ספרו לנו מה אתם מחפשים, ואנחנו נעדכן אתכם ברגע שיתפרסם מוצר מתאים.
              </p>
            </div>
            <ButtonLink href="/request-product" variant="accent" size="lg" className="rounded-full">
              פרסמו בקשת מוצר
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-page mt-16" aria-label="למה לבחור בנו">
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "קהילה בטוחה", text: "דיווח על מודעות חשודות וצוות שמטפל בהן במהירות." },
            { icon: MessageCircle, title: "צ׳אט מובנה", text: "מדברים עם המוכר ישירות באתר, בלי לחשוף מספר טלפון." },
            { icon: HandHelping, title: "בקשות מוצרים", text: "מפרסמים מה מחפשים ומקבלים התראה על התאמות." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-border/70 bg-surface p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          רוצים למכור?{" "}
          <Link href="/dashboard/products/new" className="font-medium text-primary hover:underline">פרסמו מוצר בחינם</Link>
        </p>
      </section>
    </>
  );
}
