import { z } from "zod";
import { env } from "@/env";
import type { Credentials } from "@/features/auth/types";
import { REQUEST_ID_HEADER } from "@/lib/request-id";

const TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]+$/;

const token = z.string().min(1).regex(TOKEN_PATTERN);

export const tokenPairSchema = z.object({
  access_token: token,
  refresh_token: token,
});

export type TokenPair = z.infer<typeof tokenPairSchema>;

function withRequestId(requestId: string | null, headers: Record<string, string>) {
  return requestId ? { ...headers, [REQUEST_ID_HEADER]: requestId } : headers;
}

async function readPair(response: Response): Promise<TokenPair | null> {
  if (!response.ok) {
    return null;
  }
  const parsed = tokenPairSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

// The API's login is an OAuth2 password form, so this one is not JSON.
export async function exchangeCredentials(
  credentials: Credentials,
  requestId: string | null,
): Promise<TokenPair | null> {
  const body = new URLSearchParams({
    username: credentials.email,
    password: credentials.password,
  });

  const response = await fetch(`${env.API_URL}/auth/login`, {
    method: "POST",
    headers: withRequestId(requestId, {
      "content-type": "application/x-www-form-urlencoded",
    }),
    body,
    cache: "no-store",
  }).catch(() => null);

  return response ? readPair(response) : null;
}

// Best effort: the cookies go either way, and a token the API never heard of
// is not a reason to keep a reader signed in.
export async function revokeRefresh(refreshToken: string, requestId: string | null): Promise<void> {
  await fetch(`${env.API_URL}/auth/logout`, {
    method: "POST",
    headers: withRequestId(requestId, { "content-type": "application/json" }),
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  }).catch(() => null);
}

export async function exchangeRefresh(
  refreshToken: string,
  requestId: string | null,
): Promise<TokenPair | null> {
  const response = await fetch(`${env.API_URL}/auth/refresh`, {
    method: "POST",
    headers: withRequestId(requestId, { "content-type": "application/json" }),
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  }).catch(() => null);

  return response ? readPair(response) : null;
}
