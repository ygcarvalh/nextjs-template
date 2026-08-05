import { Activity, ArrowRight, Database, KeyRound, ShieldCheck, SquareStack } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { VerificationLedger } from "@/features/verification/components/verification-ledger";
import { cn } from "@/lib/utils";

const setupCommands = [
  "git clone <this-repo> my-app && cd my-app",
  "pnpm install",
  "cp .env.example .env.local",
  "pnpm dev",
];

const decisions = [
  {
    icon: SquareStack,
    title: "Public and private are separate trees",
    body: "Route groups keep the marketing pages and the signed-in app apart, each with its own chrome and its own 404.",
    source: "src/app/(protected)/layout.tsx",
  },
  {
    icon: KeyRound,
    title: "Swapping the session takes one line",
    body: "A single binding names the adapter. Replace the signed-cookie one with an identity provider and nothing downstream changes.",
    source: "src/features/auth/server/session.ts",
  },
  {
    icon: Database,
    title: "Storage sits behind a port",
    body: "The service depends on an interface, so the in-memory repository becomes a database without touching a route handler.",
    source: "src/features/notes/server/notes-repository.ts",
  },
  {
    icon: ShieldCheck,
    title: "A lint rule holds the feature boundary",
    body: "Components cannot import a feature's server layer. Middleware is also never the only thing checking a session; the layout and the route handler check it again.",
    source: "biome.json",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
        <div className="min-w-0">
          <p className="font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]">
            Next.js 16 · App Router · TypeScript
          </p>

          <h1 className="mt-5 text-balance font-semibold text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            A starter you can defend in code review.
          </h1>

          <p className="mt-6 max-w-[52ch] text-lg text-muted-foreground leading-relaxed">
            Public and private route groups, a session seam built to be replaced, security headers
            on every response, and a test suite that gates the build.
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
              Try the protected example
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/api/health" className={cn(buttonVariants({ variant: "outline" }))}>
              <Activity aria-hidden />
              Health check
            </Link>
          </div>
          <p className="mt-3 text-muted-foreground text-sm">
            The example sits behind the gate, so that first link goes through sign-in.
          </p>
        </div>
        <VerificationLedger />
      </div>

      <section aria-labelledby="decisions-heading" className="mt-16 border-t pt-12">
        <h2
          id="decisions-heading"
          className="font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]"
        >
          Four structural decisions
        </h2>

        <ul className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {decisions.map(({ icon: Icon, title, body, source }) => (
            <li key={title}>
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
