import { getDictionary } from "@/i18n/server";

export default async function Loading() {
  const t = await getDictionary();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto w-full max-w-xl px-6 py-24"
    >
      <span className="sr-only">{t.chrome.loading}</span>
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
