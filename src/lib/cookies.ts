export const LOCALE_COOKIE = "locale";
export const PREFERENCES_COOKIE = "preferences";

const YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

export const preferenceCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: YEAR_IN_SECONDS,
} as const;
