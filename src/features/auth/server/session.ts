import "server-only";
import { cache } from "react";
import { apiSessionProvider } from "@/features/auth/server/api-session";
import type { SessionProvider } from "@/features/auth/server/session-provider";
import type { Credentials, Registration } from "@/features/auth/types";

const provider: SessionProvider = apiSessionProvider;

// A layout and its page both ask; one render should cost one call.
export const getSession = cache(() => provider.read());

export function createSession(credentials: Credentials) {
  return provider.create(credentials);
}

export function registerAccount(registration: Registration) {
  return provider.register(registration);
}

export function destroySession() {
  return provider.destroy();
}
