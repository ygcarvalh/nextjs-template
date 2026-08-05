import Link from "next/link";

const links = [
  { href: "/api/health", label: "Health" },
  { href: "/robots.txt", label: "robots.txt" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <p className="text-muted-foreground text-sm">
          A starting point. Delete whatever you don&apos;t need.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
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
