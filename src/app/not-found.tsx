import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-xl flex-1 px-6 py-24">
        <p className="font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]">
          404
        </p>

        <h1 className="mt-5 text-balance font-semibold text-4xl leading-[1.05] tracking-[-0.03em]">
          There is nothing at this address.
        </h1>

        <p className="mt-5 text-muted-foreground leading-relaxed">
          The link may be out of date, or the route was never here. The server really did return a
          404, so search engines will not index this page.
        </p>

        <dl className="mt-8 border-t">
          <div className="flex items-baseline justify-between gap-4 border-b py-3">
            <dt className="text-sm">Requested route</dt>
            <dd className="font-mono text-destructive text-sm">not found</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b py-3">
            <dt className="text-sm">Response status</dt>
            <dd className="font-mono text-sm tabular-nums">404</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={cn(buttonVariants())}>
            Go to the home page
          </Link>
          <Link href="/notes" className={cn(buttonVariants({ variant: "outline" }))}>
            Open the notes example
          </Link>
        </div>
      </main>
    </>
  );
}
