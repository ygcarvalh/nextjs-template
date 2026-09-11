import { DEFAULT_PREFERENCES, parseTheme, type Theme } from "@/features/preferences/types";

export type ChromePreferences = {
  theme: Theme;
  showRequestId: boolean;
};

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
