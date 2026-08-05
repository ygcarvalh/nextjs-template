// Server-side surface of the auth slice. Client components must not import
// from here — see the boundary rule in biome.json.
export { verifyCredentials } from "@/features/auth/server/credentials";
export { safeRedirectPath } from "@/features/auth/server/safe-redirect";
export { createSession, destroySession, getSession } from "@/features/auth/server/session";
export { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/features/auth/server/session-cookie";
export type { SessionIdentity, SessionProvider } from "@/features/auth/server/session-provider";
