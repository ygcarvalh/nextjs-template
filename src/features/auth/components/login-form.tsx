"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/server/auth-actions";
import { useDictionary } from "@/i18n/provider";
import { initialState } from "@/lib/form-state";

export function LoginForm({ next }: { next: string }) {
  const t = useDictionary();
  const [state, formAction, isPending] = useActionState(login, initialState);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor={emailId}>{t.login.email}</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-describedby={state.error ? errorId : undefined}
          aria-invalid={state.error ? true : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>{t.login.password}</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.error ? errorId : undefined}
          aria-invalid={state.error ? true : undefined}
        />
      </div>

      {state.error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t.login.submitting : t.login.submit}
      </Button>
    </form>
  );
}
