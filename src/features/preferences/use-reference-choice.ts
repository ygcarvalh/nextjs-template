"use client";

import { useCallback } from "react";
import { formOf, reload } from "@/features/preferences/preference-form";
import { chooseShowRequestId } from "@/features/preferences/server/preference-actions";

export function useReferenceChoice(): (shown: boolean) => void {
  return useCallback((shown: boolean) => {
    void chooseShowRequestId(formOf("showRequestId", String(shown))).then(reload);
  }, []);
}
