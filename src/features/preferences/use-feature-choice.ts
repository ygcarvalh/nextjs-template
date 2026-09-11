"use client";

import { useCallback } from "react";
import { formOf, reload } from "@/features/preferences/preference-form";
import { chooseFeatures } from "@/features/preferences/server/preference-actions";
import { type Flag, serializeFlags } from "@/lib/flags";

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
