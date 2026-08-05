import { ShieldCheck } from "lucide-react";
import { verificationGates } from "@/features/verification/gates";

export function VerificationLedger() {
  return (
    <section aria-labelledby="verification-heading" className="lg:sticky lg:top-8">
      <h2
        id="verification-heading"
        className="flex items-center gap-2 font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]"
      >
        <ShieldCheck aria-hidden className="size-3.5 text-pass" strokeWidth={2} />
        Verification
      </h2>

      <dl className="mt-4 border-border border-t">
        {verificationGates.map((gate, index) => (
          <div
            key={gate.label}
            className="ledger-row grid grid-cols-[1fr_auto] items-baseline gap-x-3 border-border border-b py-3"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <dt className="text-sm">{gate.label}</dt>
            <dd className="font-medium font-mono text-pass text-sm tabular-nums">{gate.value}</dd>
            <dd className="col-span-2 mt-1 font-mono text-[0.6875rem] text-muted-foreground">
              <span className="select-none">$ </span>
              {gate.command}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
        Every row runs in CI on each push. The numbers are read from the config that enforces them,
        and a test fails if this list and that config disagree.
      </p>
    </section>
  );
}
