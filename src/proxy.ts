import { type NextRequest, NextResponse } from "next/server";
import { classifyRoute, type RouteVerdict } from "@/features/auth/server/route-gate";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/features/auth/server/session-cookie";
import { applyRotation, rotateSession } from "@/features/auth/server/session-rotation";
import { clientAddress, logRequestReceived } from "@/lib/edge-request";
import { createRateLimiter } from "@/lib/rate-limit";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";

const SIGNED_IN_HOME = "/notes";

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });
const credentialLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

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

function throttle(request: NextRequest, route: RouteVerdict): NextResponse | null {
  const guardedApi = route.api && route.guarded;
  if (!guardedApi && !route.credentialPost) {
    return null;
  }
  const bucket = route.credentialPost ? credentialLimiter : limiter;
  const verdict = bucket.check(clientAddress(request));
  return verdict.allowed ? null : tooManyRequests(verdict.resetAt, verdict.limit);
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function toSignIn(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export default async function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  logRequestReceived(request, requestId);

  const route = classifyRoute(request.nextUrl.pathname, request.method);
  const throttled = throttle(request, route);
  if (throttled) {
    return tagged(throttled, requestId);
  }

  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  const rotation = await rotateSession(
    {
      access: request.cookies.get(ACCESS_COOKIE)?.value,
      refresh: request.cookies.get(REFRESH_COOKIE)?.value,
    },
    headers,
    requestId,
  );

  if (!rotation.signedIn && route.guarded) {
    return tagged(route.api ? unauthorized() : toSignIn(request), requestId);
  }

  if (rotation.signedIn && route.signedOutOnly) {
    return tagged(NextResponse.redirect(new URL(SIGNED_IN_HOME, request.url)), requestId);
  }

  const response = tagged(NextResponse.next({ request: { headers } }), requestId);
  applyRotation(response, rotation);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf|txt|xml|webmanifest)$).*)",
  ],
};
