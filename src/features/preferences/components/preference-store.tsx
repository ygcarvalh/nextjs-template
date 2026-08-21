"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { LOCALE_STORAGE_KEY, type Theme } from "@/features/preferences/types";
import type { Locale } from "@/i18n/locale";

// The cookie is what the server reads; this is the copy client code can read
// without one, and the bridge that carries a stored theme to next-themes.
export function PreferenceStore({ locale, theme }: { locale: Locale; theme: Theme | null }) {
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // A browser with storage blocked still has the cookie.
    }
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
