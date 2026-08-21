"use client";

import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useReferenceChoice } from "@/features/preferences/use-preference-choice";
import { useDictionary } from "@/i18n/provider";

export function ReferenceToggle({ enabled }: { enabled: boolean }) {
  const t = useDictionary();
  const choose = useReferenceChoice();
  const [checked, setChecked] = useState(enabled);
  const switchId = useId();

  function flip(shown: boolean) {
    setChecked(shown);
    choose(shown);
  }

  return (
    <div className="flex items-center gap-3">
      <Switch id={switchId} checked={checked} onCheckedChange={flip} />
      <Label htmlFor={switchId}>{t.settings.showReference}</Label>
    </div>
  );
}
