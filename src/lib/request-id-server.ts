import "server-only";
import { headers } from "next/headers";
import { getRequestId } from "@/lib/request-context";
import { REQUEST_ID_HEADER, sanitizeRequestId } from "@/lib/request-id";

// A route handler has the id in async storage; a server component or an action
// has it on the forwarded header the middleware set.
export async function outboundRequestId(): Promise<string | null> {
  const carried = getRequestId();
  if (carried) {
    return carried;
  }
  return sanitizeRequestId((await headers()).get(REQUEST_ID_HEADER));
}
