"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fill } from "@/i18n/fill";
import { useDictionary } from "@/i18n/provider";
import { currentRequestId } from "@/lib/request-id-client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useDictionary();
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    console.error(error);
    setRequestId(currentRequestId());
  }, [error]);

  const reference = requestId ?? error.digest;

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-24">
      <TriangleAlert aria-hidden className="size-6 text-destructive" strokeWidth={1.75} />
      <h1 className="mt-4 font-semibold text-3xl tracking-tight">{t.failure.title}</h1>
      <p className="mt-3 text-muted-foreground">{t.failure.lede}</p>
      {reference ? (
        <p className="mt-4 font-mono text-muted-foreground text-xs">
          {fill(t.failure.reference, { id: reference })}
        </p>
      ) : null}
      <div className="mt-8">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          {t.failure.retry}
        </Button>
      </div>
    </div>
  );
}
