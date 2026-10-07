import { z } from "zod";
import { MAX_PRICE, SORT_OPTIONS } from "@/lib/constants";
import { REGIONS } from "@/lib/locations";

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), MAX_PRICE) : undefined;
  });

const sortValues = SORT_OPTIONS.map((s) => s.value) as [string, ...string[]];
const regionValues = REGIONS.map((r) => r.value) as [string, ...string[]];

/** Parses URL search params. Never throws — invalid values are dropped. */
export const searchParamsSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((v) => v?.trim().slice(0, 100) || undefined),
  category: z
    .string()
    .optional()
    .transform((v) => (v && /^[a-z0-9-]{1,60}$/.test(v) ? v : undefined)),
  city: z
    .string()
    .optional()
    .transform((v) => v?.trim().slice(0, 60) || undefined),
  region: z
    .string()
    .optional()
    .transform((v) => (v && regionValues.includes(v) ? (v as (typeof regionValues)[number]) : undefined)),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  condition: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const arr = (Array.isArray(v) ? v : v ? v.split(",") : []).filter((c) =>
        ["NEW", "LIKE_NEW", "GOOD", "USED", "NEEDS_REPAIR"].includes(c),
      );
      return arr.length ? (arr as ("NEW" | "LIKE_NEW" | "GOOD" | "USED" | "NEEDS_REPAIR")[]) : undefined;
    }),
  shipping: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  sort: z
    .string()
    .optional()
    .transform((v) => (v && sortValues.includes(v) ? v : "newest") as "newest" | "price_asc" | "price_desc"),
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 && n < 1000 ? n : 1;
    }),
});

export type SearchFilters = z.infer<typeof searchParamsSchema>;

export function parseSearchParams(raw: Record<string, string | string[] | undefined>): SearchFilters {
  const flat: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(raw)) flat[k] = k === "condition" ? v : Array.isArray(v) ? v[0] : v;
  const parsed = searchParamsSchema.safeParse(flat);
  return parsed.success ? parsed.data : searchParamsSchema.parse({});
}
