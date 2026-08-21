import "server-only";
import type { SessionProvider } from "@/features/auth/server/session-provider";
import { exchangeCredentials, revokeRefresh } from "@/features/auth/server/token-exchange";
import { clearTokens, readTokens, writeTokens } from "@/features/auth/server/tokens";
import { toSession, type UserRead, userReadSchema } from "@/features/auth/types";
import { ApiError, apiGet } from "@/lib/api-client";
import { outboundRequestId } from "@/lib/request-id-server";

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
