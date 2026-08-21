import { Inbox } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionary";

export function RequestsEmpty({ t }: { t: Dictionary }) {
  return (
    <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
      <Inbox aria-hidden className="mx-auto size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="mt-3 font-medium text-sm">{t.requests.emptyTitle}</p>
      <p className="mt-1 text-muted-foreground text-sm">{t.requests.emptyLede}</p>
    </div>
  );
}
