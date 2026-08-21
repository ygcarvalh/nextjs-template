import "server-only";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { recordRequest } from "@/lib/metrics";
import { runWithRequestId } from "@/lib/request-context";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";

const SERVER_ERROR_STATUS = 500;

type RouteHandler<A extends unknown[]> = (...args: A) => Response | Promise<Response>;

function methodOf(args: unknown[]): string {
  const [first] = args;
  return first instanceof Request ? first.method : "GET";
}

function report(route: string, method: string, status: number, startedAt: number): void {
  const durationSeconds = (performance.now() - startedAt) / 1000;
  recordRequest({ method, route, status, durationSeconds });
  const event = {
    method,
    path: route,
    status_code: status,
    duration_ms: Number((durationSeconds * 1000).toFixed(3)),
  };
  if (status >= SERVER_ERROR_STATUS) {
    logger.warn(event, "request");
  } else {
    logger.info(event, "request");
  }
}

export function withRouteLogging<A extends unknown[]>(route: string, handler: RouteHandler<A>) {
  return async (...args: A): Promise<Response> => {
    const inbound = (await headers()).get(REQUEST_ID_HEADER);
    const requestId = resolveRequestId(inbound);
    const method = methodOf(args);
    const startedAt = performance.now();

    return runWithRequestId(requestId, async () => {
      try {
        const response = await handler(...args);
        response.headers.set(REQUEST_ID_HEADER, requestId);
        report(route, method, response.status, startedAt);
        return response;
      } catch (error) {
        report(route, method, SERVER_ERROR_STATUS, startedAt);
        logger.error({ err: error, path: route }, "unhandled route error");
        throw error;
      }
    });
  };
}
