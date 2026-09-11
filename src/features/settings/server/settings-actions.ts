"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/features/auth/server/session";
import { apiSend } from "@/lib/api-client";

export async function deactivateAccount(): Promise<void> {
  await apiSend("DELETE", "/users/me");
  await destroySession();
  redirect("/");
}
