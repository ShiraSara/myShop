import { z } from "zod";
import { CITY_NAMES, REGIONS } from "@/lib/locations";
import { checkbox, optionalInt, optionalText, text } from "./common";

export const productRequestSchema = z.object({
  title: text(3, 100, "מה אתם מחפשים"),
  description: optionalText(1000, "התיאור"),
  categoryId: z
    .string()
    .max(40)
    .optional()
    .transform((v) => v || null),
  maxBudget: optionalInt("התקציב", 10_000_000),
  city: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null)
    .refine((v) => v === null || CITY_NAMES.includes(v), "יש לבחור עיר מהרשימה"),
  region: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || REGIONS.some((r) => r.value === v), "אזור לא תקין"),
  shippingOk: checkbox,
  details: optionalText(1000, "פרטים נוספים"),
});

export type ProductRequestInput = z.infer<typeof productRequestSchema>;

export const messageSchema = z.object({
  body: text(1, 2000, "ההודעה"),
});

export const startConversationSchema = z.object({
  productId: z.string().min(1).max(40),
  body: text(1, 2000, "ההודעה"),
});

export const reportSchema = z.object({
  productId: z.string().min(1).max(40),
  reason: z.enum(["SPAM", "FRAUD", "PROHIBITED", "WRONG_CATEGORY", "OFFENSIVE", "OTHER"], {
    errorMap: () => ({ message: "יש לבחור סיבה" }),
  }),
  details: optionalText(1000, "הפרטים"),
});

export const profileSchema = z.object({
  name: text(2, 60, "שם"),
  phone: z
    .string()
    .optional()
    .transform((v) => v?.replace(/[\s-]/g, "") || null)
    .refine((v) => v === null || /^(\+972|0)\d{8,9}$/.test(v), "מספר טלפון לא תקין"),
  city: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null)
    .refine((v) => v === null || CITY_NAMES.includes(v), "יש לבחור עיר מהרשימה"),
  bio: optionalText(300, "הטקסט"),
});

export const categorySchema = z.object({
  name: text(2, 40, "שם הקטגוריה"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "מזהה URL קצר מדי")
    .max(60, "מזהה URL ארוך מדי")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "מזהה URL יכול להכיל אותיות באנגלית, ספרות ומקפים בלבד"),
  description: optionalText(200, "התיאור"),
  icon: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,40}$/, "שם אייקון לא תקין")
    .default("tag"),
  sortOrder: optionalInt("סדר", 1000).transform((v) => v ?? 0),
  isActive: checkbox,
});

export const settingsSchema = z.object({
  announcement: optionalText(200, "הודעת המערכת"),
  maxImagesPerProduct: optionalInt("מספר תמונות", 20).transform((v) => v ?? 10),
  allowRegistration: checkbox,
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || z.string().email().safeParse(v).success, "כתובת אימייל לא תקינה"),
});

export type SiteSettings = z.infer<typeof settingsSchema>;
