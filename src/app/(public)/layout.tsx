import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader>
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Sign in
        </Link>
      </SiteHeader>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
