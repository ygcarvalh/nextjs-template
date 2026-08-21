import "server-only";
import { toApiQuery } from "@/features/requests/filters";
import {
  type RequestFilters,
  type RequestPage,
  requestPageSchema,
} from "@/features/requests/types";
import { apiGet } from "@/lib/api-client";

export async function listRequests(filters: RequestFilters): Promise<RequestPage | null> {
  const page = await apiGet<RequestPage>(`/requests?${toApiQuery(filters)}`);
  const parsed = requestPageSchema.safeParse(page);
  return parsed.success ? parsed.data : null;
}
