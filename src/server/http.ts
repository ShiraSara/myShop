import "server-only";
import { NextResponse } from "next/server";
import { AppError, GENERIC_ERROR } from "./errors";

/**
 * CSRF protection for state-changing route handlers: the request must come from
 * our own origin. (Server Actions get the same check from Next.js automatically.)
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[api error]", error);
  return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
}
