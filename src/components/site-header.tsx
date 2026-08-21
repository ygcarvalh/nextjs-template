import Link from "next/link";
import type { ReactNode } from "react";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader({
  children,
  navLabel,
  brand,
  themeToggle = true,
}: {
  children?: ReactNode;
  navLabel: string;
  brand: string;
  themeToggle?: boolean;
}) {
  return (
    <header className="border-b">
      <nav aria-label={navLabel} className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold">
          {brand}
        </Link>
        <div className="flex items-center gap-2">
          {children}
          {themeToggle ? <ModeToggle /> : null}
        </div>
      </nav>
    </header>
  );
}
