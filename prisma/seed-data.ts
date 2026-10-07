import type { ProductCondition } from "@prisma/client";

export const CATEGORIES = [
  { slug: "electronics", name: "אלקטרוניקה", icon: "smartphone", description: "טלפונים, טאבלטים, אוזניות וגאדג׳טים" },
  { slug: "computers", name: "מחשבים", icon: "laptop", description: "מחשבים ניידים, נייחים, מסכים וציוד היקפי" },
  { slug: "furniture", name: "ריהוט", icon: "sofa", description: "ספות, שולחנות, כיסאות וארונות" },
  { slug: "bikes", name: "אופניים וקורקינטים", icon: "bike", description: "אופני עיר, הרים, ילדים וקורקינטים חשמליים" },
  { slug: "fashion", name: "אופנה", icon: "shirt", description: "בגדים, נעליים ואקססוריז" },
  { slug: "kids", name: "תינוקות וילדים", icon: "baby", description: "עגלות, צעצועים, ריהוט וביגוד לילדים" },
  { slug: "home-appliances", name: "מוצרי חשמל לבית", icon: "fridge", description: "מקררים, מכונות כביסה, מיקרוגל ועוד" },
  { slug: "gaming", name: "גיימינג", icon: "gamepad", description: "קונסולות, משחקים ואביזרים" },
  { slug: "sports", name: "ספורט ופנאי", icon: "dumbbell", description: "ציוד כושר, קמפינג ומשחקי חוץ" },
  { slug: "home-decor", name: "עיצוב הבית", icon: "lamp", description: "תאורה, שטיחים, עציצים ואקססוריז לבית" },
  { slug: "books", name: "ספרים", icon: "book", description: "ספרי קריאה, לימוד וילדים" },
  { slug: "music", name: "כלי נגינה", icon: "guitar", description: "גיטרות, קלידים, מגברים וציוד אולפן" },
  { slug: "cameras", name: "צילום", icon: "camera", description: "מצלמות, עדשות ורחפנים" },
  { slug: "tools", name: "כלי עבודה", icon: "wrench", description: "כלי עבודה, גינון ושיפוצים" },
] as const;

export const USERS = [
  { email: "admin@shuk.local", name: "מנהלת האתר", role: "ADMIN" as const, city: "תל אביב-יפו" },
  { email: "dana@example.com", name: "דנה לוי", city: "תל אביב-יפו", bio: "אוהבת עיצוב ופריטים עם סיפור." },
  { email: "yossi@example.com", name: "יוסי כהן", city: "חיפה", bio: "חובב טכנולוגיה ורכיבה." },
  { email: "noa@example.com", name: "נועה מזרחי", city: "ירושלים" },
  { email: "avi@example.com", name: "אבי פרץ", city: "באר שבע" },
  { email: "michal@example.com", name: "מיכל אברהם", city: "רעננה", bio: "אמא לשלושה, מוכרת מה שהילדים גדלו ממנו 🙂" },
  { email: "omer@example.com", name: "עומר ביטון", city: "ראשון לציון" },
  { email: "shira@example.com", name: "שירה גולן", city: "מודיעין" },
];

type SeedProduct = {
  slug: string;
  title: string;
  category: (typeof CATEGORIES)[number]["slug"];
  price: number;
  condition: ProductCondition;
  seller: number; // index in USERS
  city: string;
  shipping?: { price?: number; details?: string };
  description: string;
  featured?: boolean;
  status?: "ACTIVE" | "SOLD" | "DRAFT";
  daysAgo: number;
  images?: number;
};

export const PRODUCTS: SeedProduct[] = [
  { slug: "iphone-14-pro-128", title: "iPhone 14 Pro 128GB סגול כהה", category: "electronics", price: 2900, condition: "LIKE_NEW", seller: 1, city: "תל אביב-יפו", shipping: { price: 30, details: "שליח עד הבית תוך 2–3 ימי עסקים" }, description: "אייפון 14 פרו במצב מצוין, תמיד היה עם מגן מסך וכיסוי.\nסוללה 91%. מגיע עם קופסה מקורית וכבל.\nנמכר כי עברתי לדגם חדש.", featured: true, daysAgo: 0.1, images: 3 },
  { slug: "airpods-pro-2", title: "AirPods Pro דור 2 עם מארז MagSafe", category: "electronics", price: 650, condition: "GOOD", seller: 2, city: "חיפה", shipping: { price: 0, details: "משלוח חינם בדואר רשום" }, description: "אוזניות מקוריות, סינון רעשים עובד מעולה. סימני שימוש קלים על המארז.", daysAgo: 0.4, images: 2 },
  { slug: "samsung-galaxy-tab-s8", title: "טאבלט Samsung Galaxy Tab S8 + עט", category: "electronics", price: 1700, condition: "LIKE_NEW", seller: 7, city: "מודיעין", description: "טאבלט במצב כמו חדש, שימש בעיקר לקריאה. כולל עט S Pen וכיסוי מקלדת.", daysAgo: 2, images: 2 },
  { slug: "macbook-air-m2", title: "MacBook Air M2 13 אינץ׳ 256GB", category: "computers", price: 3800, condition: "LIKE_NEW", seller: 1, city: "תל אביב-יפו", shipping: { details: "אפשר לשלוח בתיאום" }, description: "מחשב נייד כמעט חדש, 47 מחזורי טעינה בלבד.\nצבע Midnight, מקלדת עברית/אנגלית חרוטה.\nמגיע באריזה המקורית עם המטען.", featured: true, daysAgo: 1, images: 3 },
  { slug: "dell-27-monitor", title: "מסך Dell 27 אינץ׳ 4K", category: "computers", price: 950, condition: "GOOD", seller: 6, city: "ראשון לציון", description: "מסך מעולה לעבודה, חיבורי USB-C ו-HDMI. אין פיקסלים מתים.", daysAgo: 3 },
  { slug: "mechanical-keyboard-keychron", title: "מקלדת מכנית Keychron K2 אלחוטית", category: "computers", price: 280, condition: "GOOD", seller: 2, city: "חיפה", shipping: { price: 25 }, description: "מתגים חומים, תאורה לבנה, חיבור בלוטות׳ וכבל. כולל כיתוב עברי במדבקות.", daysAgo: 5 },
  { slug: "grey-3-seat-sofa", title: "ספה תלת-מושבית אפורה מבד", category: "furniture", price: 1200, condition: "GOOD", seller: 5, city: "רעננה", description: "ספה נוחה מאוד, ריפוד בד אפור בהיר. אורך 2.2 מטר.\nבית ללא עישון וללא חיות.\nאיסוף עצמי מקומה 2 ללא מעלית.", featured: true, daysAgo: 0.8, images: 2 },
  { slug: "oak-dining-table", title: "שולחן אוכל מעץ אלון מלא + 6 כיסאות", category: "furniture", price: 2500, condition: "USED", seller: 3, city: "ירושלים", description: "שולחן עץ מלא באורך 1.8 מ׳ עם 6 כיסאות מרופדים. יש סימני שימוש קלים על המשטח.", daysAgo: 4 },
  { slug: "ikea-desk-white", title: "שולחן כתיבה לבן IKEA", category: "furniture", price: 200, condition: "GOOD", seller: 7, city: "מודיעין", description: "שולחן כתיבה 120x60, מפורק ומוכן לאיסוף.", daysAgo: 6 },
  { slug: "office-chair-ergonomic", title: "כיסא משרדי ארגונומי עם תמיכה לגב", category: "furniture", price: 450, condition: "LIKE_NEW", seller: 6, city: "ראשון לציון", shipping: { price: 60, details: "משלוח לכל אזור המרכז" }, description: "כיסא ארגונומי עם משענת רשת, ידיות מתכווננות ותמיכה מותנית.", daysAgo: 1.5 },
  { slug: "kids-bike-20-inch", title: "אופני ילדים 20 אינץ׳ — מתאים לגילאי 8–11", category: "bikes", price: 450, condition: "GOOD", seller: 5, city: "רעננה", shipping: { price: 50, details: "משלוח לאזור המרכז והשרון" }, description: "אופני ילדים כחולים במצב טוב, 6 הילוכים, בלמים תקינים. הבן גדל מהם.", daysAgo: 0.3, images: 2 },
  { slug: "electric-scooter-xiaomi", title: "קורקינט חשמלי Xiaomi Pro 2", category: "bikes", price: 1300, condition: "GOOD", seller: 6, city: "ראשון לציון", description: "קורקינט עם 2,100 ק״מ, סוללה מחזיקה כ-35 ק״מ. צמיגים הוחלפו לאחרונה.", daysAgo: 2.5 },
  { slug: "mountain-bike-trek", title: "אופני הרים Trek Marlin 7 מידה L", category: "bikes", price: 2600, condition: "LIKE_NEW", seller: 2, city: "חיפה", description: "אופני הרים כמעט חדשים, רכבתי בהם פעמים ספורות. בולם אוויר ובלמי דיסק הידראוליים.", featured: true, daysAgo: 1.2, images: 3 },
  { slug: "city-bike-vintage", title: "אופני עיר וינטג׳ עם סל", category: "bikes", price: 550, condition: "USED", seller: 1, city: "תל אביב-יפו", description: "אופני עיר נוסטלגיים בצבע מנטה, כולל סל קדמי ומנעול.", daysAgo: 8 },
  { slug: "leather-jacket-women", title: "ז׳קט עור נשים מידה M", category: "fashion", price: 380, condition: "LIKE_NEW", seller: 1, city: "תל אביב-יפו", shipping: { price: 20 }, description: "ז׳קט עור אמיתי שחור, נלבש פעמיים. גזרה מחמיאה.", daysAgo: 0.6 },
  { slug: "nike-air-max-43", title: "נעלי Nike Air Max מידה 43", category: "fashion", price: 250, condition: "GOOD", seller: 4, city: "באר שבע", shipping: { price: 25 }, description: "נעליים נוחות במצב טוב, נעלו כחצי שנה.", daysAgo: 7 },
  { slug: "stroller-bugaboo-fox", title: "עגלת תינוק Bugaboo Fox 2 כולל אמבטיה", category: "kids", price: 2200, condition: "GOOD", seller: 5, city: "רעננה", description: "עגלה מצוינת, כולל אמבטיה, מושב טיולון, כיסוי גשם ותיק. נשמרה בבית.", featured: true, daysAgo: 0.9, images: 2 },
  { slug: "lego-city-set", title: "ערכת לגו סיטי — תחנת משטרה", category: "kids", price: 180, condition: "LIKE_NEW", seller: 7, city: "מודיעין", shipping: { price: 20 }, description: "ערכה מלאה עם כל החלקים והחוברת. הורכבה פעם אחת.", daysAgo: 3.5 },
  { slug: "kids-car-seat", title: "כיסא בטיחות לרכב Maxi-Cosi", category: "kids", price: 300, condition: "GOOD", seller: 3, city: "ירושלים", description: "כיסא בטיחות לגילאי 9–18 ק״ג, לא עבר תאונה. כולל עיגון איזופיקס.", daysAgo: 9 },
  { slug: "samsung-washing-machine", title: "מכונת כביסה Samsung 8 ק״ג", category: "home-appliances", price: 900, condition: "GOOD", seller: 4, city: "באר שבע", description: "מכונת כביסה עובדת מצוין, 1400 סל״ד. נמכרת עקב מעבר דירה.", daysAgo: 2 },
  { slug: "nespresso-machine", title: "מכונת קפה Nespresso Vertuo", category: "home-appliances", price: 350, condition: "LIKE_NEW", seller: 7, city: "מודיעין", shipping: { price: 30 }, description: "מכונה במצב מעולה, כולל מקציף חלב Aeroccino.", daysAgo: 0.2 },
  { slug: "dyson-v11", title: "שואב אבק אלחוטי Dyson V11", category: "home-appliances", price: 1400, condition: "GOOD", seller: 6, city: "ראשון לציון", shipping: { price: 40 }, description: "שואב חזק, סוללה מחזיקה כ-40 דקות. כולל כל הראשים והמטען.", daysAgo: 4.5 },
  { slug: "ps5-disc-edition", title: "PlayStation 5 עם כונן + 2 שלטים", category: "gaming", price: 1900, condition: "LIKE_NEW", seller: 6, city: "ראשון לציון", shipping: { price: 50 }, description: "קונסולה במצב מצוין, כולל 2 שלטים ומשחק FIFA. אחריות עד סוף השנה.", featured: true, daysAgo: 0.5, images: 2 },
  { slug: "nintendo-switch-oled", title: "Nintendo Switch OLED לבן", category: "gaming", price: 1150, condition: "GOOD", seller: 2, city: "חיפה", shipping: { price: 30 }, description: "כולל תיק נשיאה ו-3 משחקים: מריו קארט, זלדה ואנימל קרוסינג.", daysAgo: 6 },
  { slug: "treadmill-home", title: "הליכון ביתי מתקפל", category: "sports", price: 800, condition: "USED", seller: 3, city: "ירושלים", description: "הליכון עד מהירות 14 קמ״ש, מתקפל לאחסון. עובד תקין.", daysAgo: 10 },
  { slug: "camping-tent-4", title: "אוהל ל-4 אנשים + 2 שקי שינה", category: "sports", price: 320, condition: "GOOD", seller: 4, city: "באר שבע", description: "אוהל איכותי, הוקם 3 פעמים. כולל יתדות ותיק.", daysAgo: 5 },
  { slug: "adjustable-dumbbells", title: "זוג משקולות מתכווננות עד 24 ק״ג", category: "sports", price: 700, condition: "LIKE_NEW", seller: 6, city: "ראשון לציון", description: "משקולות מתכווננות חוסכות מקום, החלפת משקל בסיבוב.", daysAgo: 1.8 },
  { slug: "floor-lamp-brass", title: "מנורת עמידה מפליז בסגנון סקנדינבי", category: "home-decor", price: 260, condition: "LIKE_NEW", seller: 1, city: "תל אביב-יפו", description: "מנורה מעוצבת בגובה 1.6 מ׳, אור חם ונעים. כולל נורה.", daysAgo: 2.2 },
  { slug: "persian-rug", title: "שטיח פרסי בעבודת יד 2x3", category: "home-decor", price: 1600, condition: "GOOD", seller: 3, city: "ירושלים", description: "שטיח צמר בעבודת יד, גוונים של אדום וכחול. נוקה מקצועית.", daysAgo: 12 },
  { slug: "monstera-plant", title: "עציץ מונסטרה גדול כולל כלי", category: "home-decor", price: 120, condition: "GOOD", seller: 7, city: "מודיעין", description: "צמח בריא בגובה מטר, כולל כלי קרמיקה לבן.", daysAgo: 0.7 },
  { slug: "harry-potter-books", title: "סדרת הארי פוטר — 7 ספרים בעברית", category: "books", price: 150, condition: "GOOD", seller: 5, city: "רעננה", shipping: { price: 25 }, description: "כל 7 הספרים בכריכה רכה, במצב טוב.", daysAgo: 3 },
  { slug: "yamaha-acoustic-guitar", title: "גיטרה אקוסטית Yamaha F310", category: "music", price: 420, condition: "GOOD", seller: 2, city: "חיפה", description: "גיטרה מצוינת למתחילים, מיתרים חדשים. כולל תיק וכייל.", daysAgo: 4 },
  { slug: "digital-piano-casio", title: "פסנתר חשמלי Casio 88 קלידים", category: "music", price: 1300, condition: "LIKE_NEW", seller: 7, city: "מודיעין", description: "פסנתר עם קלידים במשקל מלא, כולל מעמד ופדל.", daysAgo: 1.1 },
  { slug: "sony-a7iii", title: "מצלמת Sony A7 III גוף בלבד", category: "cameras", price: 4200, condition: "GOOD", seller: 1, city: "תל אביב-יפו", description: "מצלמה מקצועית, 18K תמונות. כולל 2 סוללות ומטען.", featured: true, daysAgo: 2.8, images: 2 },
  { slug: "dji-mini-3", title: "רחפן DJI Mini 3 + 3 סוללות", category: "cameras", price: 2100, condition: "LIKE_NEW", seller: 4, city: "באר שבע", shipping: { price: 40 }, description: "רחפן קל משקל, מצלמת 4K. כולל ערכת Fly More.", daysAgo: 0.25 },
  { slug: "bosch-drill-set", title: "מקדחה רוטטת Bosch + ערכת מקדחים", category: "tools", price: 280, condition: "GOOD", seller: 4, city: "באר שבע", description: "מקדחה חזקה, 2 סוללות, מזוודה וערכת ביטים.", daysAgo: 8 },
  { slug: "garden-tools-set", title: "סט כלי גינון 6 חלקים", category: "tools", price: 90, condition: "NEW", seller: 3, city: "ירושלים", description: "סט חדש באריזה, כולל מזמרה, כף ומגרפה.", daysAgo: 1.3 },
  { slug: "old-iphone-11-repair", title: "iPhone 11 — מסך סדוק, לחלקים או לתיקון", category: "electronics", price: 300, condition: "NEEDS_REPAIR", seller: 4, city: "באר שבע", description: "המכשיר נדלק ועובד, המסך סדוק בפינה. מתאים למי שיודע לתקן.", daysAgo: 6.5 },
  { slug: "kids-balance-bike", title: "אופני איזון לילדים מעץ", category: "bikes", price: 140, condition: "GOOD", seller: 7, city: "מודיעין", shipping: { price: 30 }, description: "אופני איזון לגילאי 2–4, מושב מתכוונן.", daysAgo: 2, status: "SOLD" },
  { slug: "bookshelf-wood", title: "ספרייה מעץ 5 מדפים", category: "furniture", price: 220, condition: "USED", seller: 1, city: "תל אביב-יפו", description: "ספרייה יציבה, גובה 1.8 מ׳.", daysAgo: 14, status: "SOLD" },
  { slug: "draft-coffee-table", title: "שולחן סלון עגול", category: "furniture", price: 300, condition: "GOOD", seller: 1, city: "תל אביב-יפו", description: "טיוטה — עוד לא פרסמתי את המודעה.", daysAgo: 0.05, status: "DRAFT" },
];

export const REQUESTS = [
  { user: 3, title: "מחפשת אופניים לילד בן 10", description: "אופניים לילד בגובה 1.40, עדיף עם הילוכים", maxBudget: 500, region: "CENTER" as const, shippingOk: true, category: "bikes" },
  { user: 4, title: "מחפש מחשב נייד לסטודנט", description: "מקבוק או לפטופ קל לעבודה ולימודים", maxBudget: 4000, region: null, shippingOk: true, category: "computers" },
  { user: 6, title: "עגלת תינוק במצב טוב", description: "עגלה עם אמבטיה, באזור השרון או המרכז", maxBudget: 2500, region: "SHARON" as const, shippingOk: false, category: "kids" },
  { user: 2, title: "קונסולת PS5", description: null, maxBudget: 2000, region: null, shippingOk: true, category: "gaming" },
  { user: 7, title: "ספה לסלון", description: "ספה תלת מושבית בצבע בהיר", maxBudget: 1500, region: null, shippingOk: false, category: null },
];

export const CONVERSATIONS = [
  { product: "iphone-14-pro-128", buyer: 3, messages: [
    { from: "buyer", text: "היי, המוצר עדיין זמין?" },
    { from: "seller", text: "היי! כן, זמין 🙂" },
    { from: "buyer", text: "מה מצב הסוללה? ויש אפשרות לגמישות במחיר?" },
    { from: "seller", text: "הסוללה 91%. אפשר לרדת ל-2,800 אם סוגרים השבוע." },
  ] },
  { product: "grey-3-seat-sofa", buyer: 7, messages: [
    { from: "buyer", text: "שלום, אפשר לבוא לראות את הספה מחר בערב?" },
    { from: "seller", text: "בשמחה, אחרי 18:00 מתאים?" },
    { from: "buyer", text: "מעולה, אגיע ב-19:00." },
  ] },
  { product: "ps5-disc-edition", buyer: 2, messages: [
    { from: "buyer", text: "היי, הקונסולה עוד אצלך? אפשר משלוח לחיפה?" },
  ] },
  { product: "macbook-air-m2", buyer: 4, messages: [
    { from: "buyer", text: "מה עם האחריות על המחשב?" },
    { from: "seller", text: "יש אחריות של אפל עד מרץ." },
  ] },
];
