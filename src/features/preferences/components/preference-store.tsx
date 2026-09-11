"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { LOCALE_STORAGE_KEY, type Theme } from "@/features/preferences/types";
import type { Locale } from "@/i18n/locale";

function mirrorLocaleWhenStorageAllows(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    return;
  }
}

export function PreferenceStore({ locale, theme }: { locale: Locale; theme: Theme | null }) {
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    mirrorLocaleWhenStorageAllows(locale);
  }, [locale]);

  useEffect(() => {
    if (applied.current || theme === null) {
      return;
    }
    applied.current = true;
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
