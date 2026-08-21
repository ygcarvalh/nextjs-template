import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getDictionary();

  return (
    <>
      <SiteHeader navLabel={t.chrome.mainNavigation} brand={t.chrome.brand}>
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          {t.chrome.signIn}
        </Link>
      </SiteHeader>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter t={t} />
    </>
  );
}
