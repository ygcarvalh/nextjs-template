import "server-only";
import { cookieSessionProvider } from "@/features/auth/server/cookie-session";
import type { SessionIdentity, SessionProvider } from "@/features/auth/server/session-provider";

const provider: SessionProvider = cookieSessionProvider;

export function getSession() {
  return provider.read();
}

export function createSession(identity: SessionIdentity) {
  return provider.create(identity);
}

export function destroySession() {
  return provider.destroy();
}
