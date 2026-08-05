import Link from "next/link";
import type { ReactNode } from "react";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b">
      <nav aria-label="Main" className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold">
          Next.js Template
        </Link>
        <div className="flex items-center gap-2">
          {children}
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
