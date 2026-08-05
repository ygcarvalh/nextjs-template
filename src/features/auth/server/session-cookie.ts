import { env } from "@/env";

const isSecureOrigin = env.NEXT_PUBLIC_APP_URL.startsWith("https://");

export const SESSION_COOKIE_NAME = isSecureOrigin ? "__Host-session" : "session";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isSecureOrigin,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
} as const;
