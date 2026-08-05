import "server-only";
import { cookies } from "next/headers";
import { env } from "@/env";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  sessionCookieOptions,
} from "@/features/auth/server/session-cookie";
import type { SessionProvider } from "@/features/auth/server/session-provider";
import { signSessionToken, verifySessionToken } from "@/features/auth/server/session-token";

export const cookieSessionProvider: SessionProvider = {
  async read() {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return verifySessionToken(token, env.SESSION_SECRET);
  },

  async create(identity) {
    const token = await signSessionToken(
      { ...identity, expiresAt: Date.now() + SESSION_TTL_MS },
      env.SESSION_SECRET,
    );
    (await cookies()).set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  },

  async destroy() {
    (await cookies()).delete(SESSION_COOKIE_NAME);
  },
};
