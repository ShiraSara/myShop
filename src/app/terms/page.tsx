import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "תנאי שימוש", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <PageHeader title="תנאי שימוש" />
      <div className="space-y-4 leading-relaxed text-stone-700">
        <p>{SITE_NAME} מספק פלטפורמה לפרסום מוצרים ולתקשורת בין קונים למוכרים. האתר אינו צד לעסקה ואינו אחראי למוצרים המפורסמים.</p>
        <p>חל איסור לפרסם מוצרים אסורים על פי חוק, תוכן פוגעני, מטעה או מפר זכויות. הנהלת האתר רשאית להסיר מודעות ולחסום משתמשים המפרים את התנאים.</p>
        <p>מומלץ להיפגש במקום ציבורי, לבדוק את המוצר לפני התשלום ולא להעביר תשלום מראש.</p>
        <p className="text-sm text-muted-foreground">* זהו נוסח בסיסי — יש להחליפו בתנאי שימוש ומדיניות פרטיות שנוסחו על ידי עורך דין לפני עלייה לאוויר.</p>
      </div>
    </div>
  );
}
