import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { Role } from "@prisma/client";
import { db } from "../db";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "shuk_session";
const SESSION_DAYS = 30;
const RENEW_THRESHOLD_DAYS = 15;
const DAY = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  city: string | null;
};

/** Creates a DB session and returns the raw token (only the hash is stored). */
export async function createSession(userId: string, meta: { userAgent?: string | null; ip?: string | null } = {}) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await db.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
      ip: meta.ip?.slice(0, 64) ?? null,
    },
  });
  return { token, expiresAt };
}

/** Validates a raw session token. Returns null for expired sessions or blocked users. */
export async function validateSessionToken(token: string) {
  const id = hashToken(token);
  const session = await db.session.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, status: true, avatarUrl: true, city: true } },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now() || session.user.status !== "ACTIVE") {
    await db.session.delete({ where: { id } }).catch(() => undefined);
    return null;
  }
  let renewedExpiresAt: Date | null = null;
  if (session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_DAYS * DAY) {
    renewedExpiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
    await db.session.update({ where: { id }, data: { expiresAt: renewedExpiresAt } });
  }
  const { status: _status, ...user } = session.user;
  return { sessionId: id, user: user as SessionUser, renewedExpiresAt };
}

export async function invalidateSession(token: string) {
  await db.session.deleteMany({ where: { id: hashToken(token) } });
}

export async function invalidateAllUserSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

// ── Cookie helpers (Next.js request scope) ───────────────────────────

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getRequestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent"),
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
  };
}

/** Returns the signed-in user for the current request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await validateSessionToken(token);
  if (!result) return null;
  if (result.renewedExpiresAt) {
    // Cookies can only be written from actions / route handlers; ignore during render.
    await setSessionCookie(token, result.renewedExpiresAt).catch(() => undefined);
  }
  return result.user;
});
