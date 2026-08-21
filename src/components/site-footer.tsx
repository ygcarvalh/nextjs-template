import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";

export function SiteFooter({ t }: { t: Dictionary }) {
  const links = [
    { href: "/api/health", label: t.chrome.health },
    { href: "/robots.txt", label: t.chrome.robots },
    { href: "/sitemap.xml", label: t.chrome.sitemap },
  ];

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <p className="text-muted-foreground text-sm">{t.chrome.footerNote}</p>
        <nav aria-label={t.chrome.footerNavigation} className="flex gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.1em] underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
