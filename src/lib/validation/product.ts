import { z } from "zod";
import { CITY_NAMES } from "@/lib/locations";
import { MAX_IMAGES_PER_PRODUCT, MAX_PRICE } from "@/lib/constants";
import { checkbox, optionalInt, optionalText, text } from "./common";

export const conditionSchema = z.enum(["NEW", "LIKE_NEW", "GOOD", "USED", "NEEDS_REPAIR"], {
  errorMap: () => ({ message: "יש לבחור מצב מוצר" }),
});

export const citySchema = z
  .string({ required_error: "יש לבחור עיר" })
  .trim()
  .refine((v) => CITY_NAMES.includes(v), "יש לבחור עיר מהרשימה");

export const priceSchema = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const n = typeof v === "number" ? v : Number(String(v).replace(/[,₪\s]/g, ""));
    if (v === "" || !Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "יש להזין מחיר" });
      return z.NEVER;
    }
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "המחיר חייב להיות מספר שלם וחיובי" });
      return z.NEVER;
    }
    if (n > MAX_PRICE) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "המחיר גבוה מדי" });
      return z.NEVER;
    }
    return n;
  });

/** Step-level schemas let the wizard validate one step at a time with the same rules the server uses. */
export const productDetailsSchema = z.object({
  title: text(3, 80, "שם המוצר"),
  categoryId: z.string({ required_error: "יש לבחור קטגוריה" }).min(1, "יש לבחור קטגוריה").max(40),
  price: priceSchema,
  condition: conditionSchema,
});

export const productImagesSchema = z.object({
  imageIds: z
    .array(z.string().min(1).max(40))
    .min(1, "יש להעלות לפחות תמונה אחת")
    .max(MAX_IMAGES_PER_PRODUCT, `ניתן להעלות עד ${MAX_IMAGES_PER_PRODUCT} תמונות`)
    .refine((ids) => new Set(ids).size === ids.length, "תמונה כפולה"),
  primaryImageId: z.string().min(1).max(40).optional().nullable(),
});

export const productLocationSchema = z
  .object({
    city: citySchema,
    shippingAvailable: checkbox,
    shippingPrice: optionalInt("מחיר המשלוח", 10_000),
    shippingDetails: optionalText(300, "פרטי המשלוח"),
  })
  .transform((d) => ({
    ...d,
    shippingPrice: d.shippingAvailable ? d.shippingPrice : null,
    shippingDetails: d.shippingAvailable ? d.shippingDetails : null,
  }));

export const productDescriptionSchema = z.object({
  description: text(10, 5000, "התיאור"),
});

export const productSchema = productDetailsSchema
  .merge(productImagesSchema)
  .merge(productDescriptionSchema)
  .and(productLocationSchema)
  .and(z.object({ status: z.enum(["ACTIVE", "DRAFT"]).default("ACTIVE") }));

export type ProductInput = z.infer<typeof productSchema>;
export type ProductRawInput = z.input<typeof productSchema>;

export const productStatusUpdateSchema = z.object({
  productId: z.string().min(1).max(40),
  status: z.enum(["ACTIVE", "SOLD", "ARCHIVED", "DRAFT"]),
});
