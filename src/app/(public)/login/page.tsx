import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth";
import { safeRedirectPath } from "@/features/auth/server";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getDictionary()).titles.login,
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, t] = await Promise.all([searchParams, getDictionary()]);

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-20 sm:py-28">
      <p className="running-head flex items-center gap-2">
        <LockKeyhole aria-hidden className="size-3.5" strokeWidth={2} />
        {t.login.eyebrow}
      </p>

      <h1 className="mt-4 font-semibold text-3xl tracking-[-0.03em]">{t.login.title}</h1>

      <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{t.login.lede}</p>

      <div className="mt-8">
        <LoginForm next={safeRedirectPath(next, "/notes")} />
      </div>

      <p className="mt-8 text-muted-foreground text-sm">
        {t.login.noAccount}{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          {t.login.register}
        </Link>
      </p>
    </div>
  );
}
