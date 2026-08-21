import { z } from "zod";
import { OUTCOMES } from "@/lib/outcome";

export const REQUESTS_PAGE_SIZE = 20;

export const requestLogSchema = z.object({
  id: z.number().int(),
  request_id: z.string().min(1),
  method: z.string().min(1),
  path: z.string().min(1),
  status_code: z.number().int(),
  duration_ms: z.number(),
  client_ip: z.string().nullable(),
  user_id: z.number().int().nullable(),
  created_at: z.string().min(1),
  outcome: z.enum(OUTCOMES),
});

// No total: the API pages this collection by cursor, because counting a table
// that grows by one row per request is the expensive part of reading it.
export const requestPageSchema = z.object({
  items: z.array(requestLogSchema),
  limit: z.number().int().positive(),
  next_cursor: z.string().nullable(),
});

export type RequestLog = z.infer<typeof requestLogSchema>;
export type RequestPage = z.infer<typeof requestPageSchema>;

export type RequestFilters = {
  outcome: (typeof OUTCOMES)[number] | null;
  path: string | null;
  requestId: string | null;
  cursor: string | null;
};
