"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { formOf } from "@/features/preferences/preference-form";
import { chooseTheme } from "@/features/preferences/server/preference-actions";
import { parseTheme, type Theme } from "@/features/preferences/types";

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

export function useCurrentTheme(): Theme | null {
  const { theme } = useTheme();
  return parseTheme(theme);
}
