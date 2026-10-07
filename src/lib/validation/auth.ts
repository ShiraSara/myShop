import { z } from "zod";
import { text } from "./common";

export const emailSchema = z
  .string({ required_error: "אימייל הוא שדה חובה" })
  .trim()
  .toLowerCase()
  .min(1, "אימייל הוא שדה חובה")
  .max(254, "אימייל ארוך מדי")
  .email("כתובת אימייל לא תקינה");

export const passwordSchema = z
  .string({ required_error: "סיסמה היא שדה חובה" })
  .min(8, "הסיסמה חייבת להכיל לפחות 8 תווים")
  .max(128, "הסיסמה ארוכה מדי")
  .regex(/[A-Za-zא-ת]/, "הסיסמה חייבת לכלול לפחות אות אחת")
  .regex(/\d/, "הסיסמה חייבת לכלול לפחות ספרה אחת");

export const registerSchema = z
  .object({
    name: text(2, 60, "שם"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.literal("on", { errorMap: () => ({ message: "יש לאשר את תנאי השימוש" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "הסיסמאות אינן תואמות",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "סיסמה היא שדה חובה").max(128),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "הסיסמאות אינן תואמות",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "יש להזין את הסיסמה הנוכחית"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "הסיסמאות אינן תואמות",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
