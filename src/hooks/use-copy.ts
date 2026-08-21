"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COPIED_FOR_MS = 2000;

export function useCopy(): { copied: boolean; copy: (value: string) => Promise<boolean> } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const copy = useCallback(async (value: string) => {
    if (!navigator.clipboard) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return false;
    }
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    return true;
  }, []);

  return { copied, copy };
}
