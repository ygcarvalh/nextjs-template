import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Raised by notFound() inside the protected area. Because it lives in the
// route group, it renders within (protected)/layout.tsx — a signed-in visitor
// keeps the app chrome and their session instead of landing on the marketing
// 404 and wondering whether they were signed out.
export default function ProtectedNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">404</p>
      <h1 className="mt-3 font-semibold text-3xl tracking-tight">We couldn&apos;t find that</h1>
      <p className="mt-3 text-muted-foreground">
        It may have been deleted, or it belongs to another account.
      </p>
      <div className="mt-8">
        <Link href="/notes" className={buttonVariants()}>
          Back to notes
        </Link>
      </div>
    </div>
  );
}
