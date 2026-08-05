// How the session travels over HTTP. Kept free of `next/headers` so middleware,
// which runs before that API is available, can read the same cookie name.

// The __Host- prefix pins the cookie to the exact origin with no Domain and a
// Path of "/", but browsers only honour it on Secure cookies — which rules it
// out on http://localhost.
const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_NAME = isProduction ? "__Host-session" : "session";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
} as const;
