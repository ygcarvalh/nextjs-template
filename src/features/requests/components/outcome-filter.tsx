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

// The hidden input is ours rather than the Select's, because the submit has to
// carry the value that was just picked and the component's own input is one
// render behind at that point.
export function OutcomeFilter({ current }: { current: Outcome | null }) {
  const t = useDictionary();
  const chosen = useRef<HTMLInputElement>(null);

  const labels: Record<Outcome, string> = {
    success: t.requests.outcomeSuccess,
    warning: t.requests.outcomeWarning,
    error: t.requests.outcomeError,
  };

  const items: Record<string, string> = { "": t.requests.outcomeAny, ...labels };

  // Picking an outcome filters at once: a control that changes nothing until a
  // second button is pressed reads as broken. The text fields keep the button,
  // because navigating on every keystroke would be worse.
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
