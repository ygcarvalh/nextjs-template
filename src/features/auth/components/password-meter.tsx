"use client";

import { passwordStrength, type Strength } from "@/features/auth/password-strength";
import { useDictionary } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const SEGMENTS = [1, 2, 3];

const FILLED: Record<Strength, number> = { empty: 0, weak: 1, fair: 2, strong: 3 };

const TONE: Record<Strength, string> = {
  empty: "bg-border",
  weak: "bg-destructive",
  fair: "bg-warning",
  strong: "bg-pass",
};

export function PasswordMeter({ id, password }: { id: string; password: string }) {
  const t = useDictionary();
  const strength = passwordStrength(password);
  const filled = FILLED[strength];

  return (
    <div id={id} className="space-y-2">
      <div aria-hidden className="flex gap-1">
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-0.5 flex-1 rounded-full",
              segment <= filled ? TONE[strength] : "bg-border",
            )}
          />
        ))}
      </div>

      <p aria-live="polite" className="text-muted-foreground text-sm">
        {strength === "empty" ? "" : `${t.register.strength}: ${t.register[strength]}`}
      </p>
    </div>
  );
}
