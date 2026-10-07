import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { authenticate, changePassword, registerUser, requestPasswordReset, resetPassword } from "@/server/services/auth";
import { createSession, invalidateSession, validateSessionToken } from "@/server/auth/session";
import { hashToken } from "@/server/auth/tokens";
import { registerSchema } from "@/lib/validation/auth";
import { createUser } from "../helpers/factories";

describe("Authentication", () => {
  it("registers a user with a hashed password", async () => {
    const user = await registerUser({ name: "דנה", email: "dana@test.local", password: "Secret123" });
    const stored = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toContain("Secret123");
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.role).toBe("USER");
  });

  it("rejects duplicate emails", async () => {
    await registerUser({ name: "דנה", email: "dup@test.local", password: "Secret123" });
    await expect(registerUser({ name: "דנה 2", email: "dup@test.local", password: "Secret123" })).rejects.toThrow(/כבר קיים/);
  });

  it("respects the allowRegistration setting", async () => {
    await db.siteSetting.create({ data: { key: "site", value: { allowRegistration: false } } });
    await expect(registerUser({ name: "דנה", email: "closed@test.local", password: "Secret123" })).rejects.toThrow(/סגורה/);
  });

  it("validates registration input (Zod)", () => {
    const bad = registerSchema.safeParse({ name: "a", email: "nope", password: "short", confirmPassword: "x" });
    expect(bad.success).toBe(false);
    const errors = bad.error!.flatten().fieldErrors;
    expect(errors.name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(errors.terms).toBeDefined();
    const ok = registerSchema.safeParse({ name: "דנה לוי", email: " Dana@Test.Local ", password: "Secret123", confirmPassword: "Secret123", terms: "on" });
    expect(ok.success).toBe(true);
    expect(ok.data!.email).toBe("dana@test.local");
  });

  it("authenticates with correct credentials only", async () => {
    await createUser({ email: "login@test.local", password: "Password123" });
    expect((await authenticate("login@test.local", "Password123")).ok).toBe(true);
    expect(await authenticate("login@test.local", "wrong-pass1")).toEqual({ ok: false, reason: "INVALID" });
    expect(await authenticate("nobody@test.local", "Password123")).toEqual({ ok: false, reason: "INVALID" });
  });

  it("blocks login for blocked users", async () => {
    await createUser({ email: "blocked@test.local", password: "Password123", status: "BLOCKED" });
    expect(await authenticate("blocked@test.local", "Password123")).toEqual({ ok: false, reason: "BLOCKED" });
  });

  it("creates, validates and invalidates DB sessions (only token hash stored)", async () => {
    const user = await createUser();
    const { token } = await createSession(user.id);
    const row = await db.session.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.id).toBe(hashToken(token));
    expect(row.id).not.toBe(token);

    const result = await validateSessionToken(token);
    expect(result?.user.id).toBe(user.id);

    await invalidateSession(token);
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("rejects expired sessions and sessions of blocked users", async () => {
    const user = await createUser();
    const { token } = await createSession(user.id);
    await db.session.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(token)).toBeNull();

    const { token: t2 } = await createSession(user.id);
    await db.user.update({ where: { id: user.id }, data: { status: "BLOCKED" } });
    expect(await validateSessionToken(t2)).toBeNull();
  });

  it("resets a password with a single-use token and kills existing sessions", async () => {
    const user = await createUser({ email: "reset@test.local", password: "OldPass123" });
    const { token: sessionToken } = await createSession(user.id);
    const token = await requestPasswordReset("reset@test.local");
    expect(token).toBeTruthy();
    expect(await requestPasswordReset("unknown@test.local")).toBeNull();

    await resetPassword(token!, "NewPass123");
    expect((await authenticate("reset@test.local", "NewPass123")).ok).toBe(true);
    expect((await authenticate("reset@test.local", "OldPass123")).ok).toBe(false);
    expect(await validateSessionToken(sessionToken)).toBeNull();
    await expect(resetPassword(token!, "Another123")).rejects.toThrow(/אינו תקף/);
  });

  it("changes password only with the current password", async () => {
    const user = await createUser({ password: "Current123" });
    await expect(changePassword(user.id, "wrong", "Newpass123")).rejects.toThrow(/שגויה/);
    await changePassword(user.id, "Current123", "Newpass123");
    expect((await authenticate(user.email, "Newpass123")).ok).toBe(true);
  });
});
