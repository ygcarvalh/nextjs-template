import { z } from "zod";
import { DEFAULT_LOCALE, type LOCALES } from "@/i18n/locale";

export const THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEMES)[number];

export const preferencesSchema = z.object({
  locale: z.string().min(2),
  theme: z.enum(THEMES),
  show_request_id: z.boolean(),
  features: z.string().nullable(),
});

export type StoredPreferences = z.infer<typeof preferencesSchema>;

export type Preferences = {
  locale: (typeof LOCALES)[number];
  theme: Theme;
  showRequestId: boolean;
  // Null means this account follows the environment's feature list.
  features: string | null;
};

export const DEFAULT_PREFERENCES: Preferences = {
  locale: DEFAULT_LOCALE,
  theme: "system",
  showRequestId: true,
  features: null,
};

export function parseTheme(value: unknown): Theme | null {
  return THEMES.find((theme) => theme === value) ?? null;
}

export const LOCALE_STORAGE_KEY = "locale";
