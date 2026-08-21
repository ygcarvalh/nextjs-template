import "server-only";
import { cookies } from "next/headers";
import { lifetimeSeconds } from "@/features/auth/server/jwt-claims";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  tokenCookieOptions,
} from "@/features/auth/server/session-cookie";
import type { TokenPair } from "@/features/auth/server/token-exchange";

export type StoredTokens = { access: string | null; refresh: string | null };

export async function readTokens(): Promise<StoredTokens> {
  const jar = await cookies();
  return {
    access: jar.get(ACCESS_COOKIE)?.value ?? null,
    refresh: jar.get(REFRESH_COOKIE)?.value ?? null,
  };
}

export async function writeTokens(pair: TokenPair): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, pair.access_token, tokenCookieOptions(lifetimeSeconds(pair.access_token)));
  jar.set(
    REFRESH_COOKIE,
    pair.refresh_token,
    tokenCookieOptions(lifetimeSeconds(pair.refresh_token)),
  );
}

export async function clearTokens(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}
