import { Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/account-menu";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/features/auth/server";
import { enabledFlags } from "@/features/preferences/server/features";
import { getDictionary, getLocale } from "@/i18n/server";
import type { Flag } from "@/lib/flags";
import { cn } from "@/lib/utils";

// The request log lives behind the settings screen, so the header stays about
// the app rather than about its instrumentation.
const NAV: { flag: Flag; href: string; key: "notes" }[] = [
  { flag: "notes", href: "/notes", key: "notes" },
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [session, t, locale, flags] = await Promise.all([
    getSession(),
    getDictionary(),
    getLocale(),
    enabledFlags(),
  ]);
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader navLabel={t.chrome.mainNavigation} brand={t.chrome.brand} themeToggle={false}>
        {NAV.filter(({ flag }) => flags.has(flag)).map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {t.chrome[key]}
          </Link>
        ))}
        <Link
          href="/settings"
          aria-label={t.chrome.settings}
          className="rounded-sm p-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" aria-hidden />
        </Link>
        <AccountMenu locale={locale} />
      </SiteHeader>
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
