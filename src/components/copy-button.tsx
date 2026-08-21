"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";
import { useDictionary } from "@/i18n/provider";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const t = useDictionary();
  const { copied, copy } = useCopy();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label ?? t.requests.copyReference}
      onClick={() => void copy(value)}
    >
      {copied ? (
        <Check aria-hidden className="size-3.5 text-pass" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? t.requests.copied : ""}
      </span>
    </Button>
  );
}
