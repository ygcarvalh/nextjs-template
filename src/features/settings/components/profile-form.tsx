"use client";

import { type FormEvent, useId, useState } from "react";
import { useProblemToast } from "@/components/problem-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDictionary } from "@/i18n/provider";
import { jsonRequest } from "@/lib/request";

export function ProfileForm({ email, name }: { email: string; name: string | null }) {
  const t = useDictionary();
  const report = useProblemToast();
  const [fields, setFields] = useState({ name: name ?? "", email });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const interactive = useHydrated();
  const nameId = useId();
  const emailId = useId();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await jsonRequest("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setSaved(true);
    } catch (error) {
      report(error, t.requests.unavailable);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor={nameId}>{t.settings.name}</Label>
        <Input
          id={nameId}
          name="name"
          autoComplete="name"
          value={fields.name}
          onChange={(event) => setFields({ ...fields, name: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={emailId}>{t.settings.email}</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={fields.email}
          onChange={(event) => setFields({ ...fields, email: event.target.value })}
        />
      </div>

      {saved ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t.settings.saved}
        </p>
      ) : null}

      <Button type="submit" disabled={saving || !interactive}>
        {saving ? t.settings.saving : t.settings.save}
      </Button>
    </form>
  );
}
