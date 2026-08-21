import { ArrowLeft, MapPinOff } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const t = await getDictionary();

  return (
    <>
      <SiteHeader navLabel={t.chrome.mainNavigation} brand={t.chrome.brand} />
      <main id="main-content" className="mx-auto w-full max-w-xl flex-1 px-6 py-24">
        <p className="running-head flex items-center gap-2">
          <MapPinOff aria-hidden className="size-3.5" strokeWidth={2} />
          {t.notFound.eyebrow}
        </p>

        <h1 className="mt-5 text-balance font-semibold text-4xl leading-[1.05] tracking-[-0.03em]">
          {t.notFound.title}
        </h1>

        <p className="mt-5 text-muted-foreground leading-relaxed">{t.notFound.lede}</p>

        <dl className="mt-8 border-t">
          <div className="flex items-baseline justify-between gap-4 border-b py-3">
            <dt className="text-sm">{t.notFound.requestedRoute}</dt>
            <dd className="font-mono text-destructive text-sm">{t.notFound.notFoundValue}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b py-3">
            <dt className="text-sm">{t.notFound.responseStatus}</dt>
            <dd className="font-mono text-sm tabular-nums">404</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={cn(buttonVariants())}>
            <ArrowLeft aria-hidden />
            {t.notFound.home}
          </Link>
          <Link href="/notes" className={cn(buttonVariants({ variant: "outline" }))}>
            {t.notFound.openNotes}
          </Link>
        </div>
      </main>
    </>
  );
}
