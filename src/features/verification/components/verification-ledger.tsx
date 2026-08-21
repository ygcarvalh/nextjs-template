import { ShieldCheck } from "lucide-react";
import { verificationGates } from "@/features/verification/gates";
import type { Dictionary } from "@/i18n/dictionary";

export function VerificationLedger({ t }: { t: Dictionary }) {
  return (
    <section aria-labelledby="verification-heading" className="lg:sticky lg:top-8">
      <h2
        id="verification-heading"
        className="flex items-center gap-2 font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]"
      >
        <ShieldCheck aria-hidden className="size-3.5 text-pass" strokeWidth={2} />
        {t.verification.heading}
      </h2>

      <dl className="mt-4 border-border border-t">
        {verificationGates.map((gate, index) => (
          <div
            key={gate.labelKey}
            className="ledger-row grid grid-cols-[1fr_auto] items-baseline gap-x-3 border-border border-b py-3"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <dt className="text-sm">{t.verification[gate.labelKey]}</dt>
            <dd className="font-medium font-mono text-pass text-sm tabular-nums">{gate.value}</dd>
            <dd className="col-span-2 mt-1 font-mono text-[0.6875rem] text-muted-foreground">
              <span className="select-none">$ </span>
              {gate.command}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-muted-foreground text-xs leading-relaxed">{t.verification.note}</p>
    </section>
  );
}
