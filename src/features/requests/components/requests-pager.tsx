import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { toQuery } from "@/features/requests/filters";
import type { RequestFilters, RequestPage } from "@/features/requests/types";
import type { Dictionary } from "@/i18n/dictionary";
import { fill } from "@/i18n/fill";
import { cn } from "@/lib/utils";

// Older and newest, not previous and next: a cursor walks one way, and the way
// back is the top of the list rather than a page number.
export function RequestsPager({
  page,
  filters,
  t,
}: {
  page: RequestPage;
  filters: RequestFilters;
  t: Dictionary;
}) {
  const older = page.next_cursor;

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm tabular-nums">
        {fill(t.requests.rowsOnPage, { rows: page.items.length })}
      </p>
      <div className="flex gap-2">
        {filters.cursor ? (
          <Link
            href={`/requests${toQuery(filters, { cursor: null })}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t.requests.newest}
          </Link>
        ) : null}
        {older ? (
          <Link
            href={`/requests${toQuery(filters, { cursor: older })}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t.requests.older}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
