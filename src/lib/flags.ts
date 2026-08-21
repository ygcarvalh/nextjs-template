// Optional features, not screens the app needs. Settings and the request log
// are part of the app, so they are not in here.
export const FLAGS = ["notes"] as const;

export type Flag = (typeof FLAGS)[number];

export function parseFlags(raw: string | undefined | null): Set<Flag> {
  const named = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return new Set(FLAGS.filter((flag) => named.includes(flag)));
}

export function serializeFlags(flags: Iterable<Flag>): string {
  const chosen = new Set(flags);
  return FLAGS.filter((flag) => chosen.has(flag)).join(",");
}

// An account that has named its own list gets it; everyone else follows the
// environment, which is what a deploy decides.
export function resolveFlags(environment: string, override: string | null): Set<Flag> {
  return parseFlags(override ?? environment);
}

export function flagState(flags: Set<Flag>): Record<Flag, boolean> {
  return Object.fromEntries(FLAGS.map((flag) => [flag, flags.has(flag)])) as Record<Flag, boolean>;
}
