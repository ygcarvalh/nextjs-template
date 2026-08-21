"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/features/auth/server/session";
import { apiSend } from "@/lib/api-client";

// The one write still worth being a Server Action: it ends with a redirect, so
// nothing is waiting on a re-render to tell the reader what happened.
export async function deactivateAccount(): Promise<void> {
  await apiSend("DELETE", "/users/me");
  await destroySession();
  redirect("/");
}
