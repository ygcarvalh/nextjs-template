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
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <div className="mb-8 space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          The notes example is behind the gate. Use the seeded account from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code>.
        </p>
      </div>

      <LoginForm next={safeRedirectPath(next, "/notes")} />
    </div>
  );
}
