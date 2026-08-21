"use client";

import { OctagonX, TriangleAlert } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast,
  useToastManager,
} from "@/components/ui/toast";
import { useDictionary } from "@/i18n/provider";

const ShowReferenceContext = createContext(true);

export function useShowReference(): boolean {
  return useContext(ShowReferenceContext);
}

function OutcomeIcon({ type }: { type: string | undefined }) {
  if (type === "error") {
    return (
      <span data-slot="toast-icon" className="shrink-0">
        <OctagonX aria-hidden className="size-4 text-destructive" />
      </span>
    );
  }
  return (
    <span data-slot="toast-icon" className="shrink-0">
      <TriangleAlert aria-hidden className="size-4 text-warning" />
    </span>
  );
}

function ToastList() {
  const t = useDictionary();
  const { toasts } = useToastManager();

  return toasts.map((item) => (
    <Toast key={item.id} toast={item}>
      <ToastContent>
        <OutcomeIcon type={item.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose aria-label={t.toast.dismiss} />
      </ToastContent>
    </Toast>
  ));
}

export function Toaster({
  showReference = true,
  children,
}: {
  showReference?: boolean;
  children: ReactNode;
}) {
  const t = useDictionary();

  return (
    <ShowReferenceContext value={showReference}>
      <ToastProvider toastManager={toast} limit={3}>
        {children}
        <ToastPortal>
          <ToastViewport aria-label={t.toast.region}>
            <ToastList />
          </ToastViewport>
        </ToastPortal>
      </ToastProvider>
    </ShowReferenceContext>
  );
}
