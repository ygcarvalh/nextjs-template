import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";
import { safeRedirectPath } from "@/features/auth/server";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-20 sm:py-28">
      <p className="font-medium font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-[0.14em]">
        Protected area
      </p>

      <h1 className="mt-4 font-semibold text-3xl tracking-[-0.03em]">Sign in</h1>

      <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
        The notes example sits behind the session gate. Use the seeded account from{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.example</code>.
      </p>

      <div className="mt-8">
        <LoginForm next={safeRedirectPath(next, "/notes")} />
      </div>
    </div>
  );
}
