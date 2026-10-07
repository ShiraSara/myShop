import "server-only";
import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "../errors";
import { getCurrentUser, type SessionUser } from "./session";

/** For pages: redirects to /login when signed out. */
export async function requireUserPage(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  return user;
}

/** For admin pages: signed-out → login, non-admin → 403 page. */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUserPage("/admin");
  if (user.role !== "ADMIN") redirect("/forbidden");
  return user;
}

/** For actions / API: throws typed errors. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ForbiddenError();
  return user;
}
