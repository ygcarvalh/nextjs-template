"use client";

import { useCallback } from "react";
import { formOf, reload } from "@/features/preferences/preference-form";
import { chooseLocale } from "@/features/preferences/server/preference-actions";
import type { Locale } from "@/i18n/locale";

export function useLocaleChoice(): (locale: Locale) => void {
  return useCallback((locale: Locale) => {
    void chooseLocale(formOf("locale", locale)).then(reload);
  }, []);
}
