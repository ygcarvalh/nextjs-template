import type { NextRequest } from "next/server";
import { env } from "@/env";

const UNLOGGED_PATHS = new Set(["/api/health", "/api/metrics"]);

export function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function logRequestReceived(request: NextRequest, requestId: string): void {
  if (UNLOGGED_PATHS.has(request.nextUrl.pathname)) {
    return;
  }
  console.log(
    JSON.stringify({
      event: "request.received",
      method: request.method,
      path: request.nextUrl.pathname,
      client_ip: clientAddress(request),
      request_id: requestId,
      service: env.SERVICE_NAME,
      level: "info",
      timestamp: new Date().toISOString(),
    }),
  );
}
