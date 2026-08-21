// Rewriting the forwarded cookie header is what stops the navigation that
// triggered a refresh from rendering as signed out.
export function withCookie(header: string | null, name: string, value: string): string {
  const kept = (header ?? "")
    .split("; ")
    .filter((entry) => entry.length > 0 && !entry.startsWith(`${name}=`));
  kept.push(`${name}=${value}`);
  return kept.join("; ");
}
