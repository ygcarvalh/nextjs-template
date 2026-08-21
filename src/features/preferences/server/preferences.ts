import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  type ChromePreferences,
  parseChromePreferences,
  serializeChromePreferences,
} from "@/features/preferences/preferences-cookie";
import {
  DEFAULT_PREFERENCES,
  type Preferences,
  preferencesSchema,
  type StoredPreferences,
} from "@/features/preferences/types";
import { parseLocale } from "@/i18n/locale";
import { ApiError, apiGet, apiSend } from "@/lib/api-client";
import { LOCALE_COOKIE, PREFERENCES_COOKIE, preferenceCookieOptions } from "@/lib/cookies";

const PATH = "/users/me/preferences";

function fromApi(stored: StoredPreferences): Preferences {
  return {
    locale: parseLocale(stored.locale) ?? DEFAULT_PREFERENCES.locale,
    theme: stored.theme,
    showRequestId: stored.show_request_id,
    features: stored.features,
  };
}

// A signed-out visitor has no row, and an API that is down is not a reason to
// fail a page that only wanted to know which theme to paint.
export const readPreferences = cache(async (): Promise<Preferences | null> => {
  try {
    const parsed = preferencesSchema.safeParse(await apiGet<StoredPreferences>(PATH));
    return parsed.success ? fromApi(parsed.data) : null;
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
});

export async function savePreferences(patch: Partial<StoredPreferences>): Promise<void> {
  await apiSend<StoredPreferences>("PATCH", PATH, patch);
}

// Read once, at sign-in, into the cookies every render can read for free. The
// alternative is asking the API what theme to paint on every page.
export async function adoptStoredPreferences(): Promise<void> {
  const preferences = await readPreferences();
  if (!preferences) {
    return;
  }
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, preferences.locale, preferenceCookieOptions);
  jar.set(
    PREFERENCES_COOKIE,
    serializeChromePreferences({
      theme: preferences.theme,
      showRequestId: preferences.showRequestId,
    }),
    preferenceCookieOptions,
  );
}

export async function rememberChromePreference(patch: Partial<ChromePreferences>): Promise<void> {
  const jar = await cookies();
  const current = parseChromePreferences(jar.get(PREFERENCES_COOKIE)?.value);
  jar.set(
    PREFERENCES_COOKIE,
    serializeChromePreferences({ ...current, ...patch }),
    preferenceCookieOptions,
  );
}

export async function readChromePreferences(): Promise<ChromePreferences> {
  return parseChromePreferences((await cookies()).get(PREFERENCES_COOKIE)?.value);
}
