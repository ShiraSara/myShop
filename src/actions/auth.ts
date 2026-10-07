"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { formDataToObject, zodFail, type ActionResult } from "@/lib/validation/common";
import { rateLimit } from "@/server/rate-limit";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  getRequestMeta,
  invalidateSession,
  setSessionCookie,
} from "@/server/auth/session";
import { requireUser } from "@/server/auth/guards";
import { authenticate, changePassword, registerUser, requestPasswordReset, resetPassword } from "@/server/services/auth";
import { safeAction, safeRedirectPath } from "./_utils";

async function startSession(userId: string) {
  const meta = await getRequestMeta();
  const { token, expiresAt } = await createSession(userId, meta);
  await setSessionCookie(token, expiresAt);
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let next = "/dashboard";
  const result = await safeAction(async () => {
    const parsed = registerSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    const { ip } = await getRequestMeta();
    await rateLimit(`register:${ip ?? "unknown"}`, 5, 60 * 60);
    const user = await registerUser(parsed.data);
    await startSession(user.id);
    next = safeRedirectPath(formData.get("next"), "/dashboard");
    return { ok: true };
  });
  if (result.ok) redirect(next);
  return result;
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let next = "/dashboard";
  const result = await safeAction(async () => {
    const parsed = loginSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    const { ip } = await getRequestMeta();
    await rateLimit(`login:ip:${ip ?? "unknown"}`, 30, 15 * 60);
    await rateLimit(`login:email:${parsed.data.email}`, 8, 15 * 60);
    const auth = await authenticate(parsed.data.email, parsed.data.password);
    if (!auth.ok) {
      return {
        ok: false,
        error: auth.reason === "BLOCKED" ? "החשבון חסום. לפרטים פנו לתמיכה." : "אימייל או סיסמה שגויים",
      };
    }
    await startSession(auth.user.id);
    next = safeRedirectPath(formData.get("next"), auth.user.role === "ADMIN" ? "/admin" : "/dashboard");
    return { ok: true };
  });
  if (result.ok) redirect(next);
  return result;
}

export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await invalidateSession(token);
  await clearSessionCookie();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safeAction(async () => {
    const parsed = forgotPasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    const { ip } = await getRequestMeta();
    await rateLimit(`forgot:ip:${ip ?? "unknown"}`, 10, 60 * 60);
    await rateLimit(`forgot:email:${parsed.data.email}`, 3, 60 * 60);
    await requestPasswordReset(parsed.data.email);
    // Same response whether or not the account exists.
    return { ok: true, message: "אם קיים חשבון עם האימייל הזה, שלחנו אליו קישור לאיפוס הסיסמה." };
  });
}

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await safeAction(async () => {
    const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    const { ip } = await getRequestMeta();
    await rateLimit(`reset:ip:${ip ?? "unknown"}`, 10, 60 * 60);
    const userId = await resetPassword(parsed.data.token, parsed.data.password);
    await startSession(userId);
    return { ok: true };
  });
  if (result.ok) redirect("/dashboard?reset=1");
  return result;
}

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`change-password:${user.id}`, 5, 15 * 60);
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.password);
    return { ok: true, message: "הסיסמה עודכנה בהצלחה" };
  });
}
