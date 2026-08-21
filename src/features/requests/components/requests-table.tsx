import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RequestLog } from "@/features/requests/types";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locale";
import type { Outcome } from "@/lib/outcome";

const BADGE_VARIANT: Record<Outcome, "success" | "warning" | "destructive"> = {
  success: "success",
  warning: "warning",
  error: "destructive",
};

export function RequestsTable({
  entries,
  t,
  locale,
}: {
  entries: RequestLog[];
  t: Dictionary;
  locale: Locale;
}) {
  const time = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const outcomeLabel: Record<Outcome, string> = {
    success: t.requests.outcomeSuccess,
    warning: t.requests.outcomeWarning,
    error: t.requests.outcomeError,
  };

  return (
    <div className="mt-8 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.requests.columnTime}</TableHead>
            <TableHead>{t.requests.columnMethod}</TableHead>
            <TableHead>{t.requests.columnPath}</TableHead>
            <TableHead>{t.requests.columnStatus}</TableHead>
            <TableHead className="text-right">{t.requests.columnDuration}</TableHead>
            <TableHead>{t.requests.columnReference}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                <time dateTime={entry.created_at}>{time.format(new Date(entry.created_at))}</time>
              </TableCell>
              <TableCell className="font-mono text-sm">{entry.method}</TableCell>
              <TableCell className="font-mono text-sm">{entry.path}</TableCell>
              <TableCell>
                <Badge variant={BADGE_VARIANT[entry.outcome]}>
                  {entry.status_code} {outcomeLabel[entry.outcome]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {entry.duration_ms.toFixed(1)} ms
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">{entry.request_id}</span>
                  <CopyButton value={entry.request_id} label={t.requests.copyReference} />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
