import "server-only";
import type { SessionProvider } from "@/features/auth/server/session-provider";
import { exchangeCredentials, revokeRefresh } from "@/features/auth/server/token-exchange";
import { clearTokens, readTokens, writeTokens } from "@/features/auth/server/tokens";
import { toSession, type UserRead, userReadSchema } from "@/features/auth/types";
import { ApiError, apiGet, apiSend } from "@/lib/api-client";
import { outboundRequestId } from "@/lib/request-id-server";

const CONFLICT = 409;

export const apiSessionProvider: SessionProvider = {
  async read() {
    const { access, refresh } = await readTokens();
    if (!access && !refresh) {
      return null;
    }

    try {
      const user = await apiGet<UserRead>("/users/me");
      const parsed = userReadSchema.safeParse(user);
      return parsed.success ? toSession(parsed.data) : null;
    } catch (error) {
      if (error instanceof ApiError) {
        return null;
      }
      throw error;
    }
  },

  async create(credentials) {
    const pair = await exchangeCredentials(credentials, await outboundRequestId());
    if (!pair) {
      return null;
    }
    await writeTokens(pair);
    return this.read();
  },

  // Signing up opens the first session in the same call, so a newcomer never
  // meets a sign-in form they have nothing to type into yet.
  async register(registration) {
    try {
      await apiSend("POST", "/users", registration);
    } catch (error) {
      if (error instanceof ApiError) {
        return { refused: error.status === CONFLICT ? "taken" : "unavailable" };
      }
      throw error;
    }

    const session = await this.create({
      email: registration.email,
      password: registration.password,
    });
    return session ?? { refused: "unavailable" };
  },

  // Retiring the token matters more than the cookies: the cookies only stop
  // this browser, the revocation stops anyone who copied the token.
  async destroy() {
    const { refresh } = await readTokens();
    if (refresh) {
      await revokeRefresh(refresh, await outboundRequestId());
    }
    await clearTokens();
  },
};
