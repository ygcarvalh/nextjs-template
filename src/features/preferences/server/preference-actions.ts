"use server";

import { cookies } from "next/headers";
import {
  rememberChromePreference,
  savePreferences,
} from "@/features/preferences/server/preferences";
import { parseTheme } from "@/features/preferences/types";
import { DEFAULT_LOCALE, parseLocale } from "@/i18n/locale";
import { ApiError } from "@/lib/api-client";
import { LOCALE_COOKIE, preferenceCookieOptions } from "@/lib/cookies";

// The cookie is what the next render reads, so it is written first and the
// account's copy follows. A signed-out visitor keeps the cookie and nothing else.
async function remember(patch: Parameters<typeof savePreferences>[0]): Promise<void> {
  try {
    await savePreferences(patch);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
  }
}

export async function chooseLocale(form: FormData): Promise<void> {
  const chosen = parseLocale(String(form.get("locale") ?? "")) ?? DEFAULT_LOCALE;
  (await cookies()).set(LOCALE_COOKIE, chosen, preferenceCookieOptions);
  await remember({ locale: chosen });
}

export async function chooseTheme(form: FormData): Promise<void> {
  const chosen = parseTheme(form.get("theme"));
  if (!chosen) {
    return;
  }
  await rememberChromePreference({ theme: chosen });
  await remember({ theme: chosen });
}

export async function chooseFeatures(form: FormData): Promise<void> {
  const named = form.get("features");
  await remember({ features: typeof named === "string" ? named : null });
}

export async function chooseShowRequestId(form: FormData): Promise<void> {
  const shown = form.get("showRequestId") === "true";
  await rememberChromePreference({ showRequestId: shown });
  await remember({ show_request_id: shown });
}
