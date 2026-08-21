import "server-only";
import { ApiError } from "@/lib/api-client";
import type { FormState } from "@/lib/form-state";

// The API's own sentence wins, because it is more specific than anything the
// caller could guess; the fallback covers a network failure.
export function failure(error: unknown, fallback: string): FormState {
  if (error instanceof ApiError) {
    return { error: error.message, requestId: error.requestId };
  }
  return { error: fallback, requestId: null };
}
