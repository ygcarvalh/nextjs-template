import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";

export default async function ProtectedNotFound() {
  const t = await getDictionary();

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="running-head">{t.notFound.eyebrow}</p>

      <h1 className="mt-5 text-balance font-semibold text-3xl leading-[1.1] tracking-[-0.03em]">
        {t.notFound.protectedTitle}
      </h1>

      <p className="mt-5 text-muted-foreground leading-relaxed">{t.notFound.protectedLede}</p>

      <div className="mt-10">
        <Link href="/notes" className={cn(buttonVariants())}>
          {t.notFound.backToNotes}
        </Link>
      </div>
    </div>
  );
}
