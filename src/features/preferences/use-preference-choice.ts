"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import {
  chooseFeatures,
  chooseLocale,
  chooseShowRequestId,
  chooseTheme,
} from "@/features/preferences/server/preference-actions";
import type { Theme } from "@/features/preferences/types";
import type { Locale } from "@/i18n/locale";
import { type Flag, serializeFlags } from "@/lib/flags";

function formOf(field: string, value: string): FormData {
  const form = new FormData();
  form.set(field, value);
  return form;
}

// Both togglers go through here, because a choice this browser keeps and the
// account does not is a choice the next navigation undoes.
export function useThemeChoice(): (theme: Theme) => void {
  const { setTheme } = useTheme();

  return useCallback(
    (theme: Theme) => {
      setTheme(theme);
      void chooseTheme(formOf("theme", theme));
    },
    [setTheme],
  );
}

// A reload rather than router.refresh(): the value the root layout reads is a
// cookie the action just wrote, and the tree the action replies with was
// rendered from the jar the request arrived with.
function reload(): void {
  window.location.reload();
}

export function useLocaleChoice(): (locale: Locale) => void {
  return useCallback((locale: Locale) => {
    void chooseLocale(formOf("locale", locale)).then(reload);
  }, []);
}

// Naming a list overrides the environment; naming nothing at all hands the
// account back to it.
export function useFeatureChoice(): {
  choose: (flags: Flag[]) => void;
  follow: () => void;
} {
  const choose = useCallback((flags: Flag[]) => {
    void chooseFeatures(formOf("features", serializeFlags(flags))).then(reload);
  }, []);

  const follow = useCallback(() => {
    void chooseFeatures(new FormData()).then(reload);
  }, []);

  return { choose, follow };
}

export function useReferenceChoice(): (shown: boolean) => void {
  return useCallback((shown: boolean) => {
    void chooseShowRequestId(formOf("showRequestId", String(shown))).then(reload);
  }, []);
}
