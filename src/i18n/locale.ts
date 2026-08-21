export const LOCALES = ["en-US", "pt-BR"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-US";

export const LOCALE_NAMES: Record<Locale, string> = {
  "en-US": "English",
  "pt-BR": "Português",
};

export function parseLocale(value: string | null | undefined): Locale | null {
  return LOCALES.find((locale) => locale === value) ?? null;
}

type Preference = { language: string; quality: number };

function preferences(header: string): Preference[] {
  return header
    .split(",")
    .flatMap((part) => {
      const [tag, ...parameters] = part.trim().split(";");
      if (!tag) {
        return [];
      }
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));
      const parsed = quality ? Number(quality.slice(2)) : 1;
      return [{ language: tag.toLowerCase(), quality: Number.isNaN(parsed) ? 0 : parsed }];
    })
    .sort((a, b) => b.quality - a.quality);
}

function fromHeader(header: string): Locale | null {
  for (const { language } of preferences(header)) {
    const exact = LOCALES.find((locale) => locale.toLowerCase() === language);
    if (exact) {
      return exact;
    }
    const spoken = LOCALES.find(
      (locale) => locale.toLowerCase().split("-")[0] === language.split("-")[0],
    );
    if (spoken) {
      return spoken;
    }
  }
  return null;
}

export function negotiateLocale(
  cookie: string | null | undefined,
  header: string | null | undefined,
): Locale {
  return parseLocale(cookie) ?? (header ? fromHeader(header) : null) ?? DEFAULT_LOCALE;
}
