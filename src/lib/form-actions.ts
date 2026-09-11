import "server-only";
import { ApiError } from "@/lib/api-client";
import type { FormState } from "@/lib/form-state";

export function failure(error: unknown, fallback: string): FormState {
  if (error instanceof ApiError) {
    return { error: error.message, requestId: error.requestId };
  }
  return { error: fallback, requestId: null };
}
