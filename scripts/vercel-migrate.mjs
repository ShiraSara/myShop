/**
 * Applies Prisma migrations during the Vercel build (runs before `next build`).
 *
 * - Uses `prisma migrate deploy` only: applies pending migrations, never resets,
 *   never seeds, never uses `db push`.
 * - Runs only for Production deployments (VERCEL_ENV=production), so Preview
 *   builds of unmerged branches can't change the production database.
 *   Set RUN_MIGRATIONS=true to force it (e.g. a Preview with its own database).
 * - Neon's pooled connection (PgBouncer) doesn't support the advisory locks used
 *   by migrations. If an unpooled URL is available (DATABASE_URL_UNPOOLED, set by
 *   the Neon–Vercel integration, or DIRECT_URL) it's used for this step only;
 *   otherwise DATABASE_URL is used as-is. URLs are never printed.
 */
import { spawnSync } from "node:child_process";

const env = process.env.VERCEL_ENV;
const forced = process.env.RUN_MIGRATIONS === "true";

if (env !== "production" && !forced) {
  console.log(`[migrate] Skipping prisma migrate deploy (VERCEL_ENV=${env ?? "unset"}).`);
  process.exit(0);
}

const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!migrationUrl) {
  console.error("[migrate] DATABASE_URL is not set — cannot apply migrations.");
  process.exit(1);
}

const source = process.env.DATABASE_URL_UNPOOLED ? "DATABASE_URL_UNPOOLED" : process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL";
console.log(`[migrate] Running prisma migrate deploy using ${source}…`);

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: migrationUrl },
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error("[migrate] prisma migrate deploy failed — aborting the build.");
  process.exit(result.status ?? 1);
}
console.log("[migrate] Database is up to date.");
