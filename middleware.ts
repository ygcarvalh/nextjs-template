import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { SESSION_COOKIE_NAME } from "@/features/auth/server/session-cookie";
import { verifySessionToken } from "@/features/auth/server/session-token";
import { createRateLimiter } from "@/lib/rate-limit";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";

const PROTECTED_PREFIXES = ["/notes"];
const PROTECTED_API_PREFIXES = ["/api/notes"];
const UNLOGGED_PATHS = new Set(["/api/health", "/api/metrics"]);

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Pino does not run on the edge runtime, so this writes the same shape by hand.
function logReceived(request: NextRequest, requestId: string): void {
  if (UNLOGGED_PATHS.has(request.nextUrl.pathname)) {
    return;
  }
  console.log(
    JSON.stringify({
      event: "request.received",
      method: request.method,
      path: request.nextUrl.pathname,
      client_ip: clientKey(request),
      request_id: requestId,
      service: env.SERVICE_NAME,
      level: "info",
      timestamp: new Date().toISOString(),
    }),
  );
}

// The header lets the browser and any downstream service read the id; the
// cookie lets the client error boundary quote it without a fetch to read.
function tagged(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.cookies.set({
    name: REQUEST_ID_HEADER,
    value: requestId,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  return response;
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

  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  logReceived(request, requestId);

  const isRateLimited =
    matchesPrefix(pathname, PROTECTED_API_PREFIXES) ||
    (pathname === "/login" && request.method === "POST");

  if (isRateLimited) {
    const verdict = limiter.check(clientKey(request));
    if (!verdict.allowed) {
      return tagged(tooManyRequests(verdict.resetAt, verdict.limit), requestId);
    }
  }

  const isGated =
    matchesPrefix(pathname, PROTECTED_API_PREFIXES) ||
    matchesPrefix(pathname, PROTECTED_PREFIXES) ||
    pathname === "/login";

  if (isGated) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token, env.SESSION_SECRET) : null;

    if (!session && matchesPrefix(pathname, PROTECTED_API_PREFIXES)) {
      return tagged(
        NextResponse.json({ error: "Authentication required" }, { status: 401 }),
        requestId,
      );
    }

    if (!session && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", `${pathname}${search}`);
      return tagged(NextResponse.redirect(url), requestId);
    }

    if (session && pathname === "/login" && request.method === "GET") {
      return tagged(NextResponse.redirect(new URL("/notes", request.url)), requestId);
    }
  }

  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return tagged(NextResponse.next({ request: { headers } }), requestId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
