"use client";

import { type FormEvent, useId, useState } from "react";
import { useProblemToast } from "@/components/problem-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/types";
import { useHydrated } from "@/hooks/use-hydrated";
import { fill } from "@/i18n/fill";
import { useDictionary } from "@/i18n/provider";
import { jsonRequest } from "@/lib/request";

const EMPTY = { currentPassword: "", newPassword: "", confirmation: "" };

export function PasswordForm() {
  const t = useDictionary();
  const report = useProblemToast();
  const [fields, setFields] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const interactive = useHydrated();
  const currentId = useId();
  const nextId = useId();
  const confirmId = useId();

  // The two rules a form can check without asking anyone: the same endpoint
  // checks them again, because a browser is not where a rule lives.
  function refuse(): string | null {
    if (fields.newPassword !== fields.confirmation) {
      return t.settings.passwordMismatch;
    }
    if (fields.newPassword.length < MIN_PASSWORD_LENGTH) {
      return fill(t.settings.passwordTooShort, { minimum: MIN_PASSWORD_LENGTH });
    }
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setChanged(false);
    const refusal = refuse();
    setRefused(refusal);
    if (refusal) {
      return;
    }

    setSaving(true);
    try {
      await jsonRequest("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setFields(EMPTY);
      setChanged(true);
    } catch (error) {
      report(error, t.requests.unavailable);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor={currentId}>{t.settings.currentPassword}</Label>
        <Input
          id={currentId}
          type="password"
          autoComplete="current-password"
          required
          value={fields.currentPassword}
          onChange={(event) => setFields({ ...fields, currentPassword: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={nextId}>{t.settings.newPassword}</Label>
        <Input
          id={nextId}
          type="password"
          autoComplete="new-password"
          required
          value={fields.newPassword}
          onChange={(event) => setFields({ ...fields, newPassword: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmId}>{t.settings.confirmPassword}</Label>
        <Input
          id={confirmId}
          type="password"
          autoComplete="new-password"
          required
          value={fields.confirmation}
          onChange={(event) => setFields({ ...fields, confirmation: event.target.value })}
        />
      </div>

      {refused ? (
        <p role="alert" className="text-destructive text-sm">
          {refused}
        </p>
      ) : null}

      {changed ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t.settings.passwordChanged}
        </p>
      ) : null}

      <Button type="submit" disabled={saving || !interactive}>
        {saving ? t.settings.saving : t.settings.changePassword}
      </Button>
    </form>
  );
}
