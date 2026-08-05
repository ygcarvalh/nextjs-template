import { env } from "@/env";

// How the session travels over HTTP. Kept free of `next/headers` so middleware,
// which runs before that API is available, can read the same cookie name.

// Driven by the configured origin rather than NODE_ENV. A `Secure` cookie is
// silently dropped over plain HTTP, and the `__Host-` prefix additionally
// requires it — so keying off NODE_ENV would break every production build
// served over http, including a local `next start` and end-to-end runs.
//
// This makes NEXT_PUBLIC_APP_URL the single source of truth for the origin,
// which it already is for metadataBase, robots.txt, and the sitemap. Set it to
// your real https:// origin in production and the hardened cookie follows.
const isSecureOrigin = env.NEXT_PUBLIC_APP_URL.startsWith("https://");

// __Host- pins the cookie to the exact origin: no Domain, Path=/, Secure only.
export const SESSION_COOKIE_NAME = isSecureOrigin ? "__Host-session" : "session";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isSecureOrigin,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
} as const;
