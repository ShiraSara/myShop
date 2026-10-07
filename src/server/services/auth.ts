import "server-only";
import { db } from "../db";
import { ConflictError, ValidationError } from "../errors";
import { fakeVerify, hashPassword, verifyPassword } from "../auth/password";
import { generateToken, hashToken } from "../auth/tokens";
import { invalidateAllUserSessions } from "../auth/session";
import { sendMail } from "../mail";
import { getSettings } from "./settings";
import { siteUrl } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

const RESET_TOKEN_MINUTES = 60;

export async function registerUser(input: { name: string; email: string; password: string }) {
  const settings = await getSettings();
  if (!settings.allowRegistration) throw new ValidationError("ההרשמה סגורה כרגע");
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("כבר קיים חשבון עם כתובת האימייל הזו");
  return db.user.create({
    data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password) },
    select: { id: true, name: true, email: true, role: true },
  });
}

export type AuthResult =
  | { ok: true; user: { id: string; name: string; email: string; role: string } }
  | { ok: false; reason: "INVALID" | "BLOCKED" };

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await fakeVerify(password);
    return { ok: false, reason: "INVALID" };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, reason: "INVALID" };
  if (user.status === "BLOCKED") return { ok: false, reason: "BLOCKED" };
  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  return { ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

/**
 * Creates a single-use reset token and emails it. Always resolves the same way
 * whether or not the email exists (no account enumeration). Returns the raw token
 * for tests only.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return null;
  const token = generateToken();
  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
    },
  });
  const link = siteUrl(`/reset-password/${token}`);
  await sendMail({
    to: user.email,
    subject: `איפוס סיסמה — ${SITE_NAME}`,
    text: `שלום ${user.name},\n\nלאיפוס הסיסמה לחצו על הקישור (בתוקף לשעה):\n${link}\n\nאם לא ביקשתם איפוס, אפשר להתעלם מהודעה זו.`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif"><p>שלום ${escapeHtml(user.name)},</p><p>לאיפוס הסיסמה לחצו על הקישור (בתוקף לשעה):</p><p><a href="${link}">איפוס סיסמה</a></p><p>אם לא ביקשתם איפוס, אפשר להתעלם מהודעה זו.</p></div>`,
  });
  return token;
}

export async function isResetTokenValid(token: string) {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return !!record && !record.usedAt && record.expiresAt > new Date();
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new ValidationError("הקישור לאיפוס הסיסמה אינו תקף או שפג תוקפו");
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(newPassword) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await invalidateAllUserSessions(record.userId);
  return record.userId;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ValidationError("הסיסמה הנוכחית שגויה");
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
