"use server";

import { redirect } from "next/navigation";
import { verifyCredentials } from "@/features/auth/server/credentials";
import { safeRedirectPath } from "@/features/auth/server/safe-redirect";
import { createSession, destroySession } from "@/features/auth/server/session";
import { credentialsSchema } from "@/features/auth/types";

export type LoginState = { error: string | null };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter an email address and a password." };
  }

  const identity = await verifyCredentials(parsed.data);
  if (!identity) {
    return { error: "Those credentials don't match an account." };
  }

  await createSession(identity);
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}
