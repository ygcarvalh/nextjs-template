import { REQUEST_ID_HEADER, sanitizeRequestId } from "@/lib/request-id";
import { currentRequestId } from "@/lib/request-id-client";

export type Reference = { id: string; source: "response" | "page" };

export type Problem = {
  status: number;
  message: string | null;
  reference: Reference | null;
};

export class RequestFailed extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.message ?? `Request failed with status ${problem.status}`);
    this.name = "RequestFailed";
    this.problem = problem;
  }
}

function messageOf(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  const detail = record.detail;
  if (Array.isArray(detail)) {
    const parts = detail
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
  return null;
}

function referenceOf(headers: Headers, body: unknown): Reference | null {
  const fromHeader = sanitizeRequestId(headers.get(REQUEST_ID_HEADER));
  if (fromHeader) {
    return { id: fromHeader, source: "response" };
  }
  const carried =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).request_id
      : undefined;
  const fromBody = sanitizeRequestId(typeof carried === "string" ? carried : null);
  if (fromBody) {
    return { id: fromBody, source: "response" };
  }
  const fromPage = currentRequestId();
  return fromPage ? { id: fromPage, source: "page" } : null;
}

export async function readProblem(response: Response): Promise<Problem> {
  const body = await response.json().catch(() => null);
  return {
    status: response.status,
    message: messageOf(body),
    reference: referenceOf(response.headers, body),
  };
}

export async function jsonRequest<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    const fromPage = currentRequestId();
    throw new RequestFailed({
      status: 0,
      message: null,
      reference: fromPage ? { id: fromPage, source: "page" } : null,
    });
  }

  if (!response.ok) {
    throw new RequestFailed(await readProblem(response));
  }

  return (await response.json()) as T;
}
