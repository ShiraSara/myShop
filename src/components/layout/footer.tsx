import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { LogoMark } from "./logo";

export function Footer() {
  const col = "space-y-2.5 text-sm";
  const link = "text-muted-foreground transition-colors hover:text-foreground";
  return (
    <footer className="mt-20 border-t border-border bg-surface pb-24 md:pb-0">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-xl font-extrabold">{SITE_NAME}</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{SITE_TAGLINE} מרקטפלייס ישראלי לקנייה ומכירה של מוצרים מאנשים קרובים אליכם.</p>
        </div>
        <div className={col}>
          <h2 className="font-semibold">גלישה</h2>
          <ul className="space-y-2">
            <li><Link className={link} href="/products">כל המוצרים</Link></li>
            <li><Link className={link} href="/categories">קטגוריות</Link></li>
            <li><Link className={link} href="/search">חיפוש מתקדם</Link></li>
          </ul>
        </div>
        <div className={col}>
          <h2 className="font-semibold">מכירה וקנייה</h2>
          <ul className="space-y-2">
            <li><Link className={link} href="/dashboard/products/new">פרסום מוצר</Link></li>
            <li><Link className={link} href="/request-product">בקשת מוצר</Link></li>
            <li><Link className={link} href="/dashboard">האזור האישי</Link></li>
          </ul>
        </div>
        <div className={col}>
          <h2 className="font-semibold">קנייה בטוחה</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            היפגשו במקום ציבורי, בדקו את המוצר לפני התשלום ולעולם אל תעבירו כסף מראש למוכר שלא פגשתם.
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-5 text-xs text-muted-foreground">© {new Date().getFullYear()} {SITE_NAME}. כל הזכויות שמורות.</p>
      </div>
    </footer>
  );
}
