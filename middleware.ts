import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { SESSION_COOKIE_NAME } from "@/features/auth/server/session-cookie";
import { verifySessionToken } from "@/features/auth/server/session-token";

// Middleware handles the *experience* of being signed out: it redirects early
// and preserves where the visitor was heading. It is not the authorization
// boundary — `(protected)/layout.tsx` and the route handlers re-check the
// session, so a bypass here still renders nothing.

const PROTECTED_PREFIXES = ["/notes"];
const PROTECTED_API_PREFIXES = ["/api/notes"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token, env.SESSION_SECRET) : null;

  if (!session && matchesPrefix(pathname, PROTECTED_API_PREFIXES)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!session && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/notes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/notes/:path*", "/login", "/api/notes/:path*"],
};
