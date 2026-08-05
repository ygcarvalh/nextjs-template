import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SignOutButton } from "@/features/auth";
import { getSession } from "@/features/auth/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader>
        <span className="hidden text-muted-foreground text-sm sm:inline">{session.email}</span>
        <SignOutButton />
      </SiteHeader>
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
