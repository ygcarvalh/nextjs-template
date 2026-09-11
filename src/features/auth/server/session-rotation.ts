import type { NextResponse } from "next/server";
import { withCookie } from "@/features/auth/server/forwarded-cookies";
import { expiresWithin, lifetimeSeconds } from "@/features/auth/server/jwt-claims";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  tokenCookieOptions,
} from "@/features/auth/server/session-cookie";
import { exchangeRefresh, type TokenPair } from "@/features/auth/server/token-exchange";

const ACCESS_SKEW_MS = 60_000;

export type PresentedTokens = { access: string | undefined; refresh: string | undefined };

export type SessionRotation = {
  pair: TokenPair | null;
  revoked: boolean;
  signedIn: boolean;
};

function needsRotation({ access, refresh }: PresentedTokens): boolean {
  return Boolean(refresh) && (!access || expiresWithin(access, ACCESS_SKEW_MS));
}

export async function rotateSession(
  tokens: PresentedTokens,
  forwarded: Headers,
  requestId: string,
): Promise<SessionRotation> {
  if (!tokens.refresh || !needsRotation(tokens)) {
    return { pair: null, revoked: false, signedIn: Boolean(tokens.access) };
  }

  const pair = await exchangeRefresh(tokens.refresh, requestId);
  if (!pair) {
    return { pair: null, revoked: true, signedIn: false };
  }

  forwarded.set("cookie", withCookie(forwarded.get("cookie"), ACCESS_COOKIE, pair.access_token));
  return { pair, revoked: false, signedIn: true };
}

export function applyRotation(response: NextResponse, rotation: SessionRotation): void {
  if (rotation.pair) {
    response.cookies.set(
      ACCESS_COOKIE,
      rotation.pair.access_token,
      tokenCookieOptions(lifetimeSeconds(rotation.pair.access_token)),
    );
    response.cookies.set(
      REFRESH_COOKIE,
      rotation.pair.refresh_token,
      tokenCookieOptions(lifetimeSeconds(rotation.pair.refresh_token)),
    );
  }
  if (rotation.revoked) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
}
