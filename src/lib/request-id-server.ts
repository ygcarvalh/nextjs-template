import "server-only";
import { headers } from "next/headers";
import { getRequestId } from "@/lib/request-context";
import { REQUEST_ID_HEADER, sanitizeRequestId } from "@/lib/request-id";

export async function outboundRequestId(): Promise<string | null> {
  const carried = getRequestId();
  if (carried) {
    return carried;
  }
  return sanitizeRequestId((await headers()).get(REQUEST_ID_HEADER));
}
