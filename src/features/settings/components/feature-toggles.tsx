"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFeatureChoice } from "@/features/preferences/use-preference-choice";
import { useDictionary } from "@/i18n/provider";
import { FLAGS, type Flag } from "@/lib/flags";

export function FeatureToggles({ enabled, following }: { enabled: Flag[]; following: boolean }) {
  const t = useDictionary();
  const { choose, follow } = useFeatureChoice();
  const [chosen, setChosen] = useState<Flag[]>(enabled);
  const rowId = useId();

  function flip(flag: Flag, on: boolean) {
    const next = on ? [...chosen, flag] : chosen.filter((entry) => entry !== flag);
    setChosen(next);
    choose(next);
  }

  return (
    <div className="space-y-4">
      <dl className="border-t">
        {FLAGS.map((flag) => (
          <div key={flag} className="flex items-center justify-between gap-4 border-b py-3">
            <dt>
              <Label htmlFor={`${rowId}-${flag}`} className="font-mono text-sm">
                {flag}
              </Label>
            </dt>
            <dd>
              <Switch
                id={`${rowId}-${flag}`}
                checked={chosen.includes(flag)}
                onCheckedChange={(on) => flip(flag, on)}
              />
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-muted-foreground text-sm">
        {following ? t.settings.flagsFollowing : t.settings.flagsOverridden}
      </p>

      {following ? null : (
        <Button type="button" variant="outline" size="sm" onClick={follow}>
          {t.settings.flagsUseEnvironment}
        </Button>
      )}
    </div>
  );
}
