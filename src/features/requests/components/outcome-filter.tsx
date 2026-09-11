"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDictionary } from "@/i18n/provider";
import { OUTCOMES, type Outcome } from "@/lib/outcome";

export function OutcomeFilter({ current }: { current: Outcome | null }) {
  const t = useDictionary();
  const chosen = useRef<HTMLInputElement>(null);

  const labels: Record<Outcome, string> = {
    success: t.requests.outcomeSuccess,
    warning: t.requests.outcomeWarning,
    error: t.requests.outcomeError,
  };

  const items: Record<string, string> = { "": t.requests.outcomeAny, ...labels };

  function filterBy(value: unknown) {
    const input = chosen.current;
    if (!input) {
      return;
    }
    input.value = typeof value === "string" ? value : "";
    input.form?.requestSubmit();
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="outcome">{t.requests.filterOutcome}</Label>
      <Select defaultValue={current ?? ""} items={items} onValueChange={filterBy}>
        <SelectTrigger id="outcome" className="h-9 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t.requests.outcomeAny}</SelectItem>
          {OUTCOMES.map((outcome) => (
            <SelectItem key={outcome} value={outcome}>
              {labels[outcome]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input ref={chosen} type="hidden" name="outcome" defaultValue={current ?? ""} />
    </div>
  );
}
