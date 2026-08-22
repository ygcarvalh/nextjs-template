"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordMeter } from "@/features/auth/components/password-meter";
import { signUp } from "@/features/auth/server/auth-actions";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/types";
import { useDictionary } from "@/i18n/provider";
import { initialState } from "@/lib/form-state";

export function RegisterForm() {
  const t = useDictionary();
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [password, setPassword] = useState("");
  const emailId = useId();
  const nameId = useId();
  const passwordId = useId();
  const confirmationId = useId();
  const hintId = useId();
  const meterId = useId();
  const errorId = useId();

  const describedBy = state.error ? errorId : undefined;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor={emailId}>{t.register.email}</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-describedby={describedBy}
          aria-invalid={state.error ? true : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={nameId}>{t.register.name}</Label>
        <Input id={nameId} name="name" type="text" autoComplete="name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>{t.register.password}</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={describedBy ?? `${hintId} ${meterId}`}
          aria-invalid={state.error ? true : undefined}
        />
        <p id={hintId} className="text-muted-foreground text-sm">
          {t.register.hint}
        </p>
        <PasswordMeter id={meterId} password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmationId}>{t.register.confirmation}</Label>
        <Input
          id={confirmationId}
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          aria-describedby={describedBy}
          aria-invalid={state.error ? true : undefined}
        />
      </div>

      {state.error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t.register.submitting : t.register.submit}
      </Button>
    </form>
  );
}
