import { Activity, ArrowRight, Database, KeyRound, ShieldCheck, SquareStack } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { VerificationLedger } from "@/features/verification/components/verification-ledger";
import type { Dictionary } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";

const setupCommands = [
  "git clone <this-repo> my-app && cd my-app",
  "pnpm install",
  "cp .env.example .env.local",
  "pnpm dev",
];

function decisions(t: Dictionary) {
  return [
    {
      icon: SquareStack,
      title: t.home.treesTitle,
      body: t.home.treesBody,
      source: "src/app/(protected)/layout.tsx",
    },
    {
      icon: KeyRound,
      title: t.home.sessionTitle,
      body: t.home.sessionBody,
      source: "src/features/auth/server/session.ts",
    },
    {
      icon: Database,
      title: t.home.storageTitle,
      body: t.home.storageBody,
      source: "src/features/notes/server/notes-repository.ts",
    },
    {
      icon: ShieldCheck,
      title: t.home.boundaryTitle,
      body: t.home.boundaryBody,
      source: "biome.json",
    },
  ];
}

export default async function Home() {
  const t = await getDictionary();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
        <div className="min-w-0">
          <p className="running-head">{t.home.eyebrow}</p>

          <h1 className="mt-5 text-balance font-semibold text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            {t.home.heading}
          </h1>

          <p className="mt-6 max-w-[52ch] text-lg text-muted-foreground leading-relaxed">
            {t.home.lede}
          </p>

          <div className="mt-8 overflow-x-auto rounded-lg border bg-card">
            <pre className="p-4 font-mono text-[0.8125rem] leading-7">
              <code>
                {setupCommands.map((command) => (
                  <span key={command} className="block">
                    <span className="select-none text-muted-foreground">$ </span>
                    {command}
                  </span>
                ))}
              </code>
            </pre>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/notes" className={cn(buttonVariants())}>
              {t.home.tryExample}
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/api/health" className={cn(buttonVariants({ variant: "outline" }))}>
              <Activity aria-hidden />
              {t.home.healthCheck}
            </Link>
          </div>
          <p className="mt-3 text-muted-foreground text-sm">{t.home.gateNote}</p>
        </div>
        <VerificationLedger t={t} />
      </div>

      <section aria-labelledby="decisions-heading" className="mt-16 border-t pt-12">
        <h2 id="decisions-heading" className="running-head">
          {t.home.decisionsHeading}
        </h2>

        <ul className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {decisions(t).map(({ icon: Icon, title, body, source }) => (
            <li key={source}>
              <Icon aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
              <h3 className="mt-3 font-medium text-base">{title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{body}</p>
              <p className="mt-3 font-mono text-[0.6875rem] text-muted-foreground">{source}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
