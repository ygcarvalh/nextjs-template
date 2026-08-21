"use client";

import { useCallback } from "react";
import { useShowReference } from "@/components/toaster";
import { useToastManager } from "@/components/ui/toast";
import { useCopy } from "@/hooks/use-copy";
import { useDictionary } from "@/i18n/provider";
import { outcomeOf } from "@/lib/outcome";
import { type Problem, RequestFailed } from "@/lib/request";

const WARNING_TIMEOUT_MS = 6000;
const STICKY = 0;

function problemOf(error: unknown): Problem {
  if (error instanceof RequestFailed) {
    return error.problem;
  }
  return { status: 0, message: null, reference: null };
}

export function useProblemToast(): (error: unknown, fallback: string) => void {
  const t = useDictionary();
  const manager = useToastManager();
  const showReference = useShowReference();
  const { copy } = useCopy();

  return useCallback(
    (error: unknown, fallback: string) => {
      const problem = problemOf(error);
      const outcome = outcomeOf(problem.status);
      const reference = showReference ? problem.reference : null;

      manager.add({
        type: outcome,
        // An error is announced urgently and stays until it is dismissed; a
        // refusal is a normal answer and goes away on its own.
        priority: outcome === "error" ? "high" : "low",
        timeout: outcome === "error" ? STICKY : WARNING_TIMEOUT_MS,
        title: outcome === "error" ? t.toast.errorTitle : t.toast.warningTitle,
        description: (
          <span className="flex flex-col gap-1">
            <span>{problem.message ?? fallback}</span>
            {reference ? (
              <span className="font-mono text-xs">{reference.id}</span>
            ) : (
              <span className="text-xs">{t.toast.noReference}</span>
            )}
            {reference?.source === "page" ? (
              <span className="text-xs">{t.toast.pageReference}</span>
            ) : null}
          </span>
        ),
        actionProps: reference
          ? {
              children: t.toast.copyReference,
              onClick: () => {
                void copy(reference.id);
              },
            }
          : undefined,
      });
    },
    [manager, showReference, copy, t],
  );
}
