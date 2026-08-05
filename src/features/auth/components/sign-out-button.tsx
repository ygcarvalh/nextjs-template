import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/server/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut aria-hidden />
        Sign out
      </Button>
    </form>
  );
}
