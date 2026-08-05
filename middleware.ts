import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { SESSION_COOKIE_NAME } from "@/features/auth/server/session-cookie";
import { verifySessionToken } from "@/features/auth/server/session-token";
import { createRateLimiter } from "@/lib/rate-limit";

// Middleware handles the *experience* of being signed out: it redirects early
// and preserves where the visitor was heading. It is not the authorization
// boundary — `(protected)/layout.tsx` and the route handlers re-check the
// session, so a bypass here still renders nothing.

const PROTECTED_PREFIXES = ["/notes"];
const PROTECTED_API_PREFIXES = ["/api/notes"];

// Deliberately not applied to /api/health, so uptime probes are never throttled.
const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// There is no trustworthy client IP without a known proxy in front. These
// headers are set by the platform edge (Vercel, Cloudflare, a load balancer);
// if you self-host, make sure yours is the one writing them, because a client
// can otherwise forge x-forwarded-for and get a fresh bucket per request.
function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function tooManyRequests(resetAt: number, limit: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "RateLimit-Limit": String(limit),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(retryAfter),
      },
    },
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Rate limit the endpoints that do work: the notes API and the sign-in POST.
  const isRateLimited =
    matchesPrefix(pathname, PROTECTED_API_PREFIXES) ||
    (pathname === "/login" && request.method === "POST");

  if (isRateLimited) {
    const verdict = limiter.check(clientKey(request));
    if (!verdict.allowed) {
      return tooManyRequests(verdict.resetAt, verdict.limit);
    }
  }

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

  if (session && pathname === "/login" && request.method === "GET") {
    return NextResponse.redirect(new URL("/notes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/notes/:path*", "/login", "/api/notes/:path*"],
};
