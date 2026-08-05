"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-24">
      <TriangleAlert aria-hidden className="size-6 text-destructive" strokeWidth={1.75} />
      <h1 className="mt-4 font-semibold text-3xl tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        The page failed to load. Trying again often clears it.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-muted-foreground text-xs">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
      </div>
    </div>
  );
}
