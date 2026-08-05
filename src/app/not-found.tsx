import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

// Catches unmatched URLs anywhere in the app. It renders inside the root
// layout only, so it brings its own chrome — the group layouts are not in
// scope here. See (protected)/not-found.tsx for the in-app counterpart.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-xl flex-1 px-6 py-24">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">404</p>
        <h1 className="mt-3 font-semibold text-3xl tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mt-3 text-muted-foreground">
          The link may be out of date, or the route was never there.
        </p>
        <div className="mt-8">
          <Link href="/" className={buttonVariants()}>
            Go to the home page
          </Link>
        </div>
      </main>
    </>
  );
}
