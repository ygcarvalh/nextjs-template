import "server-only";
import { cache } from "react";
import { env } from "@/env";
import { readPreferences } from "@/features/preferences/server/preferences";
import { ApiError, apiGet } from "@/lib/api-client";
import { type Flag, resolveFlags } from "@/lib/flags";

export const enabledFlags = cache(async (): Promise<Set<Flag>> => {
  const preferences = await readPreferences();
  return resolveFlags(env.FEATURE_FLAGS, preferences?.features ?? null);
});

export const followsEnvironment = cache(async (): Promise<boolean> => {
  return (await readPreferences())?.features == null;
});

// The API decides which endpoints exist, and a screen with no endpoint behind
// it is worth hiding rather than letting it fail.
export const apiFeatures = cache(async (): Promise<Set<string>> => {
  try {
    const answer = await apiGet<{ flags?: unknown }>("/features");
    const flags = Array.isArray(answer?.flags) ? answer.flags : [];
    return new Set(flags.filter((flag): flag is string => typeof flag === "string"));
  } catch (error) {
    if (error instanceof ApiError) {
      return new Set();
    }
    throw error;
  }
});
