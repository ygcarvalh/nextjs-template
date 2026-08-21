import { REQUESTS_PAGE_SIZE, type RequestFilters } from "@/features/requests/types";
import { OUTCOMES } from "@/lib/outcome";
import { sanitizeRequestId } from "@/lib/request-id";

const MAX_PATH_LENGTH = 512;
const CURSOR_PATTERN = /^[A-Za-z0-9_=-]{1,200}$/;

type Params = Record<string, string | string[] | undefined>;

function single(params: Params, key: string): string | null {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export function parseRequestFilters(params: Params): RequestFilters {
  const outcome = OUTCOMES.find((candidate) => candidate === single(params, "outcome")) ?? null;
  const path = (single(params, "path") ?? "").trim().slice(0, MAX_PATH_LENGTH);
  const cursor = single(params, "cursor");

  return {
    outcome,
    path: path === "" ? null : path,
    requestId: sanitizeRequestId(single(params, "request_id")),
    // The API refuses a cursor it did not issue; this only keeps a malformed one
    // out of the query string in the first place.
    cursor: cursor && CURSOR_PATTERN.test(cursor) ? cursor : null,
  };
}

export function toQuery(filters: RequestFilters, overrides: Partial<RequestFilters> = {}): string {
  const merged = { ...filters, ...overrides };
  const query = new URLSearchParams();
  if (merged.outcome) {
    query.set("outcome", merged.outcome);
  }
  if (merged.path) {
    query.set("path", merged.path);
  }
  if (merged.requestId) {
    query.set("request_id", merged.requestId);
  }
  if (merged.cursor) {
    query.set("cursor", merged.cursor);
  }
  const rendered = query.toString();
  return rendered === "" ? "" : `?${rendered}`;
}

export function toApiQuery(filters: RequestFilters): string {
  const query = new URLSearchParams({ limit: String(REQUESTS_PAGE_SIZE) });
  if (filters.outcome) {
    query.set("outcome", filters.outcome);
  }
  if (filters.path) {
    query.set("path", filters.path);
  }
  if (filters.requestId) {
    query.set("request_id", filters.requestId);
  }
  if (filters.cursor) {
    query.set("cursor", filters.cursor);
  }
  return query.toString();
}
