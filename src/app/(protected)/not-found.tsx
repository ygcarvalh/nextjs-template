import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProtectedNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]">
        404
      </p>

      <h1 className="mt-5 text-balance font-semibold text-3xl leading-[1.1] tracking-[-0.03em]">
        We couldn&apos;t find that.
      </h1>

      <p className="mt-5 text-muted-foreground leading-relaxed">
        It may have been deleted, or it belongs to another account. You are still signed in.
      </p>

      <div className="mt-10">
        <Link href="/notes" className={cn(buttonVariants())}>
          Back to notes
        </Link>
      </div>
    </div>
  );
}
