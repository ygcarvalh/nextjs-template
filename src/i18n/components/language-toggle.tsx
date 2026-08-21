"use client";

import type { MouseEvent } from "react";
import { chooseLocale } from "@/features/preferences/server/preference-actions";
import { useLocaleChoice } from "@/features/preferences/use-preference-choice";
import { BrazilFlag, UnitedStatesFlag } from "@/i18n/components/flags";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const FLAGS = { "en-US": UnitedStatesFlag, "pt-BR": BrazilFlag } as const;

// Two paths on purpose. The form is what a click before hydration takes, and it
// works with no JavaScript at all; once hydrated the handler wins, because it
// can refresh the router and a bare revalidation cannot.
export function LanguageToggle({ current }: { current: Locale }) {
  const choose = useLocaleChoice();

  function pick(event: MouseEvent<HTMLButtonElement>, locale: Locale) {
    event.preventDefault();
    choose(locale);
  }

  return (
    <div className="flex items-center gap-2">
      {LOCALES.map((locale) => {
        const Flag = FLAGS[locale];
        const here = locale === current;
        return (
          <form key={locale} action={chooseLocale}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              onClick={(event) => pick(event, locale)}
              aria-label={LOCALE_NAMES[locale]}
              title={LOCALE_NAMES[locale]}
              aria-current={here ? "true" : undefined}
              className={cn(
                "rounded-sm ring-1 ring-foreground/15 transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
                here ? "opacity-100" : "opacity-45 hover:opacity-80",
              )}
            >
              <Flag className="h-3.5 w-5 rounded-sm" />
            </button>
          </form>
        );
      })}
    </div>
  );
}
