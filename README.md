# שוק — מרקטפלייס ישראלי

מרקטפלייס מלא לקנייה ומכירה של מוצרים חדשים ויד שנייה: פרסום מוצרים עם תמונות, חיפוש וסינון, מועדפים, צ׳אט בין קונה למוכר, בקשות מוצרים עם התאמה אוטומטית, אזור אישי וממשק ניהול.
עברית מלאה, RTL, Mobile First.

## Stack

| שכבה | טכנולוגיה | למה |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR/SEO, Server Actions, API Routes בפרויקט אחד |
| Styling / UI | **Tailwind CSS 4** + רכיבים עצמאיים על בסיס **Radix UI** (Dialog, Dropdown) | נגישות מובנית, תמיכת RTL, בלי תלות כבדה |
| Database | **PostgreSQL** + **Prisma 6** | Relations, indexes, migrations; חיפוש טקסט עם `pg_trgm` |
| Auth | **Sessions בבסיס הנתונים** (bcrypt + cookie httpOnly) | ראו "החלטות" למטה |
| Validation | **Zod** — אותן סכמות בצד הלקוח ובשרת | |
| Images | **sharp** (ניקוי EXIF, הקטנה, המרה ל-WebP) + Storage מתחלף: `local` או **S3-compatible** (Supabase Storage / Cloudflare R2 / AWS S3 / MinIO) | |
| Tests | **Vitest** (unit + integration מול Postgres אמיתי), **Playwright** (E2E) | |
| Font | Heebo (next/font) | |

### החלטות טכנולוגיות (וסיבות)

- **Auth עצמאי במקום Auth.js** — עם התחברות באימייל וסיסמה, Auth.js מחייב JWT (אי אפשר לבטל session או לחסום משתמש באופן מיידי), ו-v5 עדיין בבטא. כאן: token אקראי של 32 בתים ב-cookie `httpOnly`, ובבסיס הנתונים נשמר רק ה-hash (SHA-256) שלו. חסימת משתמש או איפוס סיסמה מבטלים את כל ה-sessions שלו מיד. אפשר להוסיף בהמשך התחברות עם Google/OAuth (למשל Arctic) מעל אותה טבלת `Session`.
- **Storage עם driver מתחלף** — `local` לפיתוח, `s3` לכל ספק תואם S3. אין נעילה לספק מסוים, ובבסיס הנתונים נשמרים רק URL ו-storage key.
- **צ׳אט ב-polling** (כל 4 שניות, עוצר כשהטאב מוסתר) — יציב ופשוט, ולא מצריך תשתית נוספת. ה-endpoint `GET /api/conversations/:id/messages?after=` מבודד, כך שאפשר להחליף אותו בהמשך ב-SSE / Pusher / Supabase Realtime.
- **Rate limiting ב-Postgres** — עובד גם עם כמה instances ו-serverless בלי Redis. אם התנועה תגדל, אפשר להחליף ל-Upstash.

## Features

- **ציבורי:** דף בית (Hero + חיפוש לפי אזור, קטגוריות, מוצרים חדשים ומומלצים, CTA לבקשת מוצר), כל המוצרים, קטגוריות, עמוד מוצר (גלריה עם מסך מלא ו-swipe, שיתוף, דיווח, פרטי מוכר, מוצרים דומים, CTA דביק במובייל), חיפוש עם פילטרים (קטגוריה, אזור, עיר, טווח מחירים, מצב, משלוח), מיון ו-pagination
- **אזור אישי:** סקירה עם סטטיסטיקות, המוצרים שלי (עריכה, סימון כנמכר, ארכיון, מחיקה), Wizard פרסום ב-5 שלבים (Drag & Drop, progress, בחירת תמונה ראשית, שינוי סדר, Preview, שמירה כטיוטה), הודעות (רשימה + שיחה, Read receipts, unread counts, optimistic UI), מועדפים, בקשות מוצרים עם התאמות, התראות, פרופיל ושינוי סיסמה
- **Admin:** סטטיסטיקות ו-audit log, משתמשים (חיפוש, חסימה וביטול חסימה), מוצרים (שינוי סטטוס, קידום למומלצים, מחיקה), ניהול קטגוריות, דיווחים (הסרת מודעה / סגירה), בקשות מוצרים, הגדרות אתר (באנר הודעה, מספר תמונות מקסימלי, פתיחה וסגירה של הרשמה)
- **התאמת בקשות:** `src/server/matching/` — ממשק `MatchingEngine` ומנוע `rules-v1` (קטגוריה, מילות מפתח בעברית עם טיפול בתחיליות וברבים, מחיר עם סובלנות של 10%, עיר/אזור/משלוח). ההתאמה רצה גם בפרסום מוצר וגם ביצירת בקשה, והמשתמש מקבל התראה. כדי לעבור ל-AI כותבים מנוע חדש ומפעילים אותו עם `setMatchingEngine()`.
- **SEO:** metadata לכל עמוד, OpenGraph, canonical, JSON-LD (`Product`, `BreadcrumbList`, `WebSite` + SearchAction), `sitemap.xml` דינמי, `robots.txt`, דפי 404 עם סטטוס 404 אמיתי
- **אבטחה:** bcrypt, sessions מגובבים, בדיקת הרשאות בכל service (בצ׳אט רק הקונה והמוכר יכולים לגשת לשיחה, וכל משתמש אחר מקבל 404), Zod בשרת, rate limiting (התחברות, הרשמה, איפוס סיסמה, הודעות, העלאות, דיווחים, בקשות), בדיקת magic bytes, MIME וגודל לתמונות ועיבוד מחדש עם sharp, בדיקת Origin (CSRF) ב-route של ההעלאות (Server Actions מוגנים מובנית), CSP ו-security headers, הגנה מ-open redirect, Prisma (בלי SQL גולמי מבוסס קלט משתמש)

## Installation

דרישות: Node.js 20.9 ומעלה, PostgreSQL 14 ומעלה.

```bash
git clone <repo> && cd myShop
npm install
cp .env.example .env          # ומלאו ערכים, לפחות DATABASE_URL ו-AUTH_SECRET
```

## Environment variables

| משתנה | חובה | תיאור |
|---|---|---|
| `DATABASE_URL` | ✔ | חיבור ל-PostgreSQL |
| `AUTH_SECRET` | ✔ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | ✔ | כתובת האתר (canonical, sitemap, מיילים) |
| `STORAGE_DRIVER` | | `local` (ברירת מחדל) או `s3` |
| `STORAGE_LOCAL_DIR` | | תיקייה ל-driver המקומי (`storage/uploads`) |
| `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_URL`, `STORAGE_FORCE_PATH_STYLE` | ל-`s3` | פרטי ה-bucket. `STORAGE_PUBLIC_URL` הוא בסיס ה-URL הציבורי של הקבצים |
| `MAIL_DRIVER` | | `console` (מדפיס ללוג) או `resend` |
| `MAIL_FROM`, `RESEND_API_KEY` | ל-`resend` | שליחת מייל איפוס סיסמה |
| `SEED_USER_PASSWORD` | | הסיסמה של משתמשי הדמו |

לעולם אל תעשו commit לקובץ `.env`, הוא כבר ב-`.gitignore`.

## Database setup

```bash
# יצירת DB מקומי (דוגמה)
createuser -P marketplace        # סיסמה: marketplace
createdb -O marketplace marketplace

npm run db:deploy     # מריץ את ה-migrations (או db:migrate בפיתוח)
npm run db:seed       # נתוני דמו
```

ה-migration הראשון יוצר את ה-extension `pg_trgm` (extension מסוג trusted ב-PG13 ומעלה, ונתמך ב-Supabase, Neon ו-RDS).

### Seed

ה-seed יוצר 14 קטגוריות, 8 משתמשים, 41 מוצרים עם 54 תמונות, 4 שיחות, מועדפים, 5 בקשות עם התאמות, דיווחים והתראות. התמונות נוצרות מקומית עם sharp (איורים לפי קטגוריה), כך שה-seed לא תלוי ברשת.

| משתמש | סיסמה | תפקיד |
|---|---|---|
| `admin@shuk.local` | `Password123!` | מנהל |
| `dana@example.com` | `Password123!` | מוכרת עם מוצרים ושיחות |
| `noa@example.com`, `yossi@example.com`, ... | `Password123!` | משתמשים |

## Development

```bash
npm run dev           # http://localhost:3000
npm run db:studio     # Prisma Studio
```

## Tests & quality

```bash
npm run lint
npm run typecheck
npm test              # Vitest — דורש DB בדיקות (ברירת מחדל: marketplace_test, ניתן לשנות עם TEST_DATABASE_URL)
npm run test:e2e      # Playwright — מול DB עם seed. מומלץ להריץ את השרת עם DISABLE_RATE_LIMIT=true
```

כיסוי: Authentication (הרשמה, התחברות, חסימה, sessions, איפוס סיסמה), יצירה, עריכה ומחיקה של מוצרים כולל הרשאות ותמונות, מועדפים, הרשאות בצ׳אט, בקשות מוצרים והתאמות, חיפוש ופילטרים, העלאת תמונות, rate limit, דיווחים. ב-E2E: הרשמה, פרסום מוצר דרך ה-Wizard עם העלאת תמונה, מועדפים, הודעה למוכר ותשובה, חסימת צד שלישי משיחה, סימון כנמכר, CSRF, אזור Admin, בקשת מוצר, 404, SEO ו-Mobile.

## Production build

```bash
npm run build
npm run start
```

## Deployment

**המלצה: Vercel + Neon/Supabase (Postgres) + Cloudflare R2 או Supabase Storage.**

1. מעלים את הקוד ל-GitHub (ראו למטה).
2. יוצרים DB מנוהל (Neon / Supabase / Railway) ומעתיקים את `DATABASE_URL`.
3. יוצרים bucket ציבורי לקריאה (R2 / Supabase Storage / S3) ומפתחות גישה, ומגדירים `STORAGE_DRIVER=s3` ואת שאר משתני `STORAGE_*`.
4. ב-Vercel: Import Project, מגדירים את כל משתני הסביבה, ומשנים את Build Command ל-`npx prisma migrate deploy && npm run build`.
5. מגדירים דומיין, ומעדכנים את `NEXT_PUBLIC_SITE_URL`.
6. (מומלץ) Cron יומי שמריץ `npm run cleanup:images` (ניקוי תמונות יתומות, sessions שפגו ושורות rate-limit ישנות).

**שרת עצמאי (VPS / Docker):** ה-driver `local` עובד בשרת יחיד עם דיסק קבוע. מגישים מאחורי reverse proxy (Nginx/Caddy) עם HTTPS, ומריצים `npm run db:deploy && npm run build && npm run start` (למשל עם PM2).

## Upload to GitHub

```bash
git add .
git commit -m "Initial marketplace"
git remote add origin git@github.com:<user>/<repo>.git   # אם עוד לא קיים
git push -u origin main
```

ב-`.github/workflows/ci.yml` מוגדר CI שמריץ lint, typecheck, tests (עם Postgres) ו-build על כל push ו-PR.

## Project structure

```
prisma/              schema, migrations, seed
src/
  app/               routes (public, (auth), dashboard, admin, api)
  actions/           Server Actions — שכבה דקה: auth → validation → rate limit → service
  server/
    auth/            sessions, password hashing, guards
    services/        business logic (products, search, messaging, requests, admin…)
    matching/        MatchingEngine interface + rules engine
    storage/         local / S3 drivers
    db.ts, errors.ts, rate-limit.ts, mail.ts, http.ts
  lib/               utils, constants, locations, Hebrew keywords, Zod schemas
  components/        ui/, layout/, product/, forms/, messages/, search/, dashboard/, admin/
tests/               unit, integration (Vitest), e2e (Playwright)
scripts/             maintenance scripts
```

## מה נשאר לשלב הבא

- Realtime לצ׳אט (SSE / Pusher / Supabase Realtime) במקום polling
- התחברות עם Google ואימות אימייל
- העלאת תמונת פרופיל
- התראות במייל וב-Push על הודעות והתאמות
- מנוע התאמה מבוסס embeddings / LLM (מימוש של `MatchingEngine`)
- חיפוש מתקדם (Postgres FTS / Meilisearch), שמירת חיפושים
- Monitoring (Sentry) ו-analytics
- תמונות אמיתיות ב-seed, ותנאי שימוש ומדיניות פרטיות משפטיים
