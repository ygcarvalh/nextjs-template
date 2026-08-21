import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { withCookie } from "@/features/auth/server/forwarded-cookies";
import { expiresWithin, lifetimeSeconds } from "@/features/auth/server/jwt-claims";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  tokenCookieOptions,
} from "@/features/auth/server/session-cookie";
import { exchangeRefresh, type TokenPair } from "@/features/auth/server/token-exchange";
import { createRateLimiter } from "@/lib/rate-limit";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";

// Everything is gated unless it is named here, so a screen added next month is
// protected by forgetting rather than by remembering.
const PUBLIC_PAGES = new Set(["/", "/login"]);
const PUBLIC_API = new Set(["/api/health", "/api/metrics"]);
const CREDENTIAL_POSTS = new Set(["/login"]);
const UNLOGGED_PATHS = new Set(["/api/health", "/api/metrics"]);

const ACCESS_SKEW_MS = 60_000;

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });
const credentialLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

function isApi(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
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

function storeTokens(response: NextResponse, pair: TokenPair): void {
  response.cookies.set(
    ACCESS_COOKIE,
    pair.access_token,
    tokenCookieOptions(lifetimeSeconds(pair.access_token)),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    pair.refresh_token,
    tokenCookieOptions(lifetimeSeconds(pair.refresh_token)),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  logReceived(request, requestId);

  const guardedApi = isApi(pathname) && !PUBLIC_API.has(pathname);
  const guardedPage = !isApi(pathname) && !PUBLIC_PAGES.has(pathname);
  // Server Actions are deliberately not counted. A 429 is not something a
  // Server Action can answer with: React gets a response it cannot read, the
  // form stays pending, and the reader is left with a button that says Saving
  // forever. What is worth throttling — sign-in and the password change — the
  // API throttles, where the answer can carry a message.
  const isCredentialPost = CREDENTIAL_POSTS.has(pathname) && request.method === "POST";

  if (guardedApi || isCredentialPost) {
    const bucket = isCredentialPost ? credentialLimiter : limiter;
    const verdict = bucket.check(clientKey(request));
    if (!verdict.allowed) {
      return tagged(tooManyRequests(verdict.resetAt, verdict.limit), requestId);
    }
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);

  // The only place that can rotate the pair for a render: a server component
  // cannot write a cookie.
  let rotated: TokenPair | null = null;
  let cleared = false;
  if (refresh && (!access || expiresWithin(access, ACCESS_SKEW_MS))) {
    rotated = await exchangeRefresh(refresh, requestId);
    if (rotated) {
      headers.set("cookie", withCookie(headers.get("cookie"), ACCESS_COOKIE, rotated.access_token));
    } else {
      cleared = true;
    }
  }

  const signedIn = Boolean(rotated) || (Boolean(access) && !cleared);

  if (!signedIn && guardedApi) {
    return tagged(
      NextResponse.json({ error: "Authentication required" }, { status: 401 }),
      requestId,
    );
  }

  if (!signedIn && guardedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return tagged(NextResponse.redirect(url), requestId);
  }

  if (signedIn && pathname === "/login" && request.method === "GET") {
    return tagged(NextResponse.redirect(new URL("/notes", request.url)), requestId);
  }

  const response = tagged(NextResponse.next({ request: { headers } }), requestId);
  if (rotated) {
    storeTokens(response, rotated);
  }
  if (cleared) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf|txt|xml|webmanifest)$).*)",
  ],
};
