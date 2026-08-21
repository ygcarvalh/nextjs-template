import { DEFAULT_PREFERENCES, parseTheme, type Theme } from "@/features/preferences/types";

export type ChromePreferences = {
  theme: Theme;
  showRequestId: boolean;
};

// What the chrome needs to paint itself, small enough to ride in a cookie. The
// row on the account stays the source that follows a reader to another device;
// this is the copy a render can have for free.
export function parseChromePreferences(value: string | undefined): ChromePreferences {
  const fallback: ChromePreferences = {
    theme: DEFAULT_PREFERENCES.theme,
    showRequestId: DEFAULT_PREFERENCES.showRequestId,
  };

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      theme: parseTheme(parsed.theme) ?? fallback.theme,
      showRequestId:
        typeof parsed.showRequestId === "boolean" ? parsed.showRequestId : fallback.showRequestId,
    };
  } catch {
    return fallback;
  }
}

export function serializeChromePreferences(preferences: Partial<ChromePreferences>): string {
  return JSON.stringify(preferences);
}
