import { env } from "@/env";

const isSecureOrigin = env.NEXT_PUBLIC_APP_URL.startsWith("https://");

export const ACCESS_COOKIE = isSecureOrigin ? "__Host-access" : "access";
export const REFRESH_COOKIE = isSecureOrigin ? "__Host-refresh" : "refresh";

export function tokenCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureOrigin,
    path: "/",
    maxAge: maxAgeSeconds,
  } as const;
}
