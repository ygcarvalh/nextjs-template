"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/features/auth/server/safe-redirect";
import { createSession, destroySession } from "@/features/auth/server/session";
import { credentialsSchema } from "@/features/auth/types";
import { adoptStoredPreferences } from "@/features/preferences/server/preferences";
import { getDictionary } from "@/i18n/server";
import type { FormState } from "@/lib/form-state";

export async function login(_previous: FormState, formData: FormData): Promise<FormState> {
  const t = await getDictionary();
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: t.login.incomplete };
  }

  const session = await createSession(parsed.data);
  if (!session) {
    return { error: t.login.rejected };
  }

  await adoptStoredPreferences();
  redirect(safeRedirectPath(formData.get("next"), "/notes"));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}
