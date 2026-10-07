import { z } from "zod";

/** Trim and collapse whitespace; strip control chars (keeps newlines). */
export const cleanText = (value: string) =>
  value
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const text = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} הוא שדה חובה`, invalid_type_error: `${label} אינו תקין` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} הוא שדה חובה` : `${label} חייב להכיל לפחות ${min} תווים`)
        .max(max, `${label} יכול להכיל עד ${max} תווים`),
    );

export const optionalText = (max: number, label: string) =>
  z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? cleanText(v) : ""))
    .pipe(z.string().max(max, `${label} יכול להכיל עד ${max} תווים`))
    .transform((v) => (v.length ? v : null));

/** Accepts "", undefined, string or number. Empty → null. */
export const optionalInt = (label: string, max: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v, ctx) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[,₪\s]/g, ""));
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} חייב להיות מספר שלם חיובי` });
        return z.NEVER;
      }
      if (n > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} גבוה מדי` });
        return z.NEVER;
      }
      return n;
    });

export const checkbox = z
  .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function zodFail(error: z.ZodError): { ok: false; error: string; fieldErrors: FieldErrors } {
  return { ok: false, error: "יש לתקן את השדות המסומנים", fieldErrors: error.flatten().fieldErrors as FieldErrors };
}

export function formDataToObject(formData: FormData) {
  const obj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (key in obj) {
      const existing = obj[key];
      obj[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
