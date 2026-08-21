"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deactivateAccount } from "@/features/settings/server/settings-actions";
import { fill } from "@/i18n/fill";
import { useDictionary } from "@/i18n/provider";

export function DeactivateAccount({ email }: { email: string }) {
  const t = useDictionary();
  const [typed, setTyped] = useState("");
  const confirmId = useId();

  return (
    <form action={deactivateAccount} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor={confirmId}>{fill(t.settings.confirmEmailLabel, { email })}</Label>
        <Input
          id={confirmId}
          name="confirmation"
          value={typed}
          autoComplete="off"
          onChange={(event) => setTyped(event.target.value)}
        />
      </div>

      <Button type="submit" variant="destructive" disabled={typed !== email}>
        {t.settings.deactivate}
      </Button>
    </form>
  );
}
