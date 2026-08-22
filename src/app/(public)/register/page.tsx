import { UserRoundPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getDictionary()).titles.register,
    robots: { index: false, follow: false },
  };
}

export default async function RegisterPage() {
  const t = await getDictionary();

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-20 sm:py-28">
      <p className="running-head flex items-center gap-2">
        <UserRoundPlus aria-hidden className="size-3.5" strokeWidth={2} />
        {t.register.eyebrow}
      </p>

      <h1 className="mt-4 font-semibold text-3xl tracking-[-0.03em]">{t.register.title}</h1>

      <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{t.register.lede}</p>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="mt-8 text-muted-foreground text-sm">
        {t.register.haveAccount}{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          {t.register.signIn}
        </Link>
      </p>
    </div>
  );
}
