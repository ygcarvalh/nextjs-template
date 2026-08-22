"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/features/auth/server/safe-redirect";
import { createSession, destroySession, registerAccount } from "@/features/auth/server/session";
import { credentialsSchema, type Refusal, registrationSchema } from "@/features/auth/types";
import { adoptStoredPreferences } from "@/features/preferences/server/preferences";
import { getDictionary } from "@/i18n/server";
import type { FormState } from "@/lib/form-state";

// Where both doors lead when nothing else was asked for.
const HOME = "/notes";

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
  redirect(safeRedirectPath(formData.get("next"), HOME));
}

export async function signUp(_previous: FormState, formData: FormData): Promise<FormState> {
  const t = await getDictionary();
  const refusals: Record<Refusal, string> = {
    taken: t.register.taken,
    unavailable: t.register.unavailable,
  };
  const password = formData.get("password");
  const name = formData.get("name");
  const parsed = registrationSchema.safeParse({
    email: formData.get("email"),
    password,
    name: typeof name === "string" && name.trim() ? name.trim() : undefined,
  });

  if (!parsed.success) {
    return { error: t.register.incomplete };
  }

  if (formData.get("confirmation") !== password) {
    return { error: t.register.mismatch };
  }

  const outcome = await registerAccount(parsed.data);
  if ("refused" in outcome) {
    return { error: refusals[outcome.refused] };
  }

  await adoptStoredPreferences();
  redirect(HOME);
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}
