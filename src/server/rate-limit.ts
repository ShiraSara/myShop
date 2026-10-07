import "server-only";
import { db } from "./db";
import { RateLimitError } from "./errors";

/**
 * Fixed-window rate limiter backed by Postgres, so limits hold across
 * multiple server instances / serverless invocations without extra infra.
 * Swap for Redis (e.g. Upstash) if traffic grows.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  if (process.env.DISABLE_RATE_LIMIT === "true") return { remaining: limit };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${expiresAt} ELSE "RateLimit"."expiresAt" END
    RETURNING "count"
  `;
  const count = rows[0]?.count ?? 1;
  if (count > limit) throw new RateLimitError();

  // Opportunistic cleanup of expired windows (~1% of calls)
  if (Math.random() < 0.01) {
    await db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
  }
  return { remaining: limit - count };
}
