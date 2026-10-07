import type { ProductCondition, ProductStatus, Region, ReportReason, ReportStatus, RequestStatus } from "@prisma/client";

export const SITE_NAME = "שוק";
export const SITE_TAGLINE = "קונים ומוכרים. פשוט.";
export const SITE_DESCRIPTION =
  "שוק הוא המרקטפלייס הישראלי לקנייה ומכירה של מוצרים חדשים ויד שנייה — אלקטרוניקה, ריהוט, אופניים, אופנה ועוד, מאנשים קרובים אליכם.";

export const CONDITIONS: { value: ProductCondition; label: string; description: string }[] = [
  { value: "NEW", label: "חדש", description: "באריזה המקורית, לא נעשה בו שימוש" },
  { value: "LIKE_NEW", label: "כמו חדש", description: "שימוש מועט, ללא סימני שימוש" },
  { value: "GOOD", label: "מצב טוב", description: "סימני שימוש קלים, עובד מצוין" },
  { value: "USED", label: "משומש", description: "סימני שימוש ניכרים, תקין" },
  { value: "NEEDS_REPAIR", label: "דורש תיקון", description: "לא תקין במלואו / לחלקים" },
];

export const CONDITION_LABELS = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label])) as Record<
  ProductCondition,
  string
>;

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "פעיל",
  SOLD: "נמכר",
  DRAFT: "טיוטה",
  ARCHIVED: "בארכיון",
  REMOVED: "הוסר",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: "פתוחה",
  FULFILLED: "נמצא",
  CLOSED: "סגורה",
};

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "FRAUD", label: "חשד להונאה" },
  { value: "SPAM", label: "ספאם / פרסום כפול" },
  { value: "PROHIBITED", label: "מוצר אסור למכירה" },
  { value: "WRONG_CATEGORY", label: "קטגוריה שגויה" },
  { value: "OFFENSIVE", label: "תוכן פוגעני" },
  { value: "OTHER", label: "אחר" },
];

export const REPORT_REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label])) as Record<
  ReportReason,
  string
>;

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "פתוח",
  REVIEWED: "נבדק",
  ACTIONED: "טופל",
  DISMISSED: "נדחה",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "החדשים ביותר" },
  { value: "price_asc", label: "מחיר: מהנמוך לגבוה" },
  { value: "price_desc", label: "מחיר: מהגבוה לנמוך" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 24;
export const MAX_IMAGES_PER_PRODUCT = 10;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB per file
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];
export const MAX_PRICE = 10_000_000;

export type { Region };
