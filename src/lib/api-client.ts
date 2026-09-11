import "server-only";
import { env } from "@/env";
import { exchangeRefresh } from "@/features/auth/server/token-exchange";
import { clearTokens, readTokens, writeTokens } from "@/features/auth/server/tokens";
import { REQUEST_ID_HEADER, sanitizeRequestId } from "@/lib/request-id";
import { outboundRequestId } from "@/lib/request-id-server";

const UNAUTHORIZED = 401;
const NO_CONTENT = 204;

export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly expired: boolean;

  constructor(status: number, message: string, requestId: string | null, expired = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.expired = expired;
  }
}

export function readMessage(body: unknown, fallback: string): string {
  if (typeof body !== "object" || body === null) {
    return fallback;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.length > 0) {
    return record.message;
  }
  if (typeof record.detail === "string" && record.detail.length > 0) {
    return record.detail;
  }
  if (Array.isArray(record.detail)) {
    const parts = record.detail
      .map((entry) =>
        typeof entry === "object" && entry !== null
          ? (entry as Record<string, unknown>).msg
          : undefined,
      )
      .filter((part): part is string => typeof part === "string");
    if (parts.length > 0) {
      return parts.join("; ");
    }
  }
  return fallback;
}

export function readRequestId(body: unknown, headers: Headers): string | null {
  const carried =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).request_id
      : undefined;
  return (
    sanitizeRequestId(typeof carried === "string" ? carried : null) ??
    sanitizeRequestId(headers.get(REQUEST_ID_HEADER))
  );
}

async function send(path: string, init: RequestInit, access: string | null): Promise<Response> {
  const requestId = await outboundRequestId();
  const headers = new Headers(init.headers);
  if (access) {
    headers.set("authorization", `Bearer ${access}`);
  }
  if (requestId) {
    headers.set(REQUEST_ID_HEADER, requestId);
  }

  return fetch(`${env.API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
  });
}

function refusedOutsideAnAction(error: unknown): boolean {
  return error instanceof Error && /can only be modified/i.test(error.message);
}

async function writeJarWhenAllowed(write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch (error) {
    if (!refusedOutsideAnAction(error)) {
      throw error;
    }
  }
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { access, refresh } = await readTokens();
  const response = await send(path, init, access);

  if (response.status !== UNAUTHORIZED || !refresh) {
    return response;
  }

  const pair = await exchangeRefresh(refresh, await outboundRequestId());
  if (!pair) {
    await writeJarWhenAllowed(clearTokens);
    throw new ApiError(UNAUTHORIZED, "The session has expired.", null, true);
  }

  await writeJarWhenAllowed(() => writeTokens(pair));
  return send(path, init, pair.access_token);
}

async function unwrap<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === NO_CONTENT) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      readMessage(body, fallback),
      readRequestId(body, response.headers),
    );
  }
  return body as T;
}

const FALLBACK_MESSAGE = "The request was refused.";

export function apiGet<T>(path: string, fallback = FALLBACK_MESSAGE): Promise<T> {
  return apiFetch(path).then((response) => unwrap<T>(response, fallback));
}

export function apiSend<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  fallback = FALLBACK_MESSAGE,
): Promise<T> {
  return apiFetch(path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((response) => unwrap<T>(response, fallback));
}
