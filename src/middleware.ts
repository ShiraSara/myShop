import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "shuk_session";

/**
 * Fast, optimistic gate for private areas: no session cookie → redirect to login.
 * Real authorization (valid session, role, ownership) is always enforced server-side.
 */
export function middleware(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
