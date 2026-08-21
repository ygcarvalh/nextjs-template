export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-24" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
