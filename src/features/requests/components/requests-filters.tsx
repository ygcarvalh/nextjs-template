import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutcomeFilter } from "@/features/requests/components/outcome-filter";
import type { RequestFilters } from "@/features/requests/types";
import type { Dictionary } from "@/i18n/dictionary";

// A GET form, so the URL stays the state and the filters survive a share or a
// reload. The select carries its own hidden input, so that still holds.
export function RequestsFilters({ filters, t }: { filters: RequestFilters; t: Dictionary }) {
  return (
    <form method="get" className="mt-8 flex flex-wrap items-end gap-4">
      <OutcomeFilter current={filters.outcome} />

      <div className="space-y-2">
        <Label htmlFor="path">{t.requests.filterPath}</Label>
        <Input id="path" name="path" defaultValue={filters.path ?? ""} placeholder="/api/v1" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="request_id">{t.requests.filterReference}</Label>
        <Input
          id="request_id"
          name="request_id"
          defaultValue={filters.requestId ?? ""}
          className="font-mono"
        />
      </div>

      <Button type="submit" variant="outline">
        {t.requests.apply}
      </Button>
    </form>
  );
}
