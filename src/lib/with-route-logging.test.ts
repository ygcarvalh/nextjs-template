import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderMetrics } from "@/lib/metrics";
import { getRequestId } from "@/lib/request-context";
import { REQUEST_ID_HEADER } from "@/lib/request-id";
import { withRouteLogging } from "@/lib/with-route-logging";

const inboundHeaders = vi.hoisted(() => ({ current: new Headers() }));

vi.mock("next/headers", () => ({
  headers: async () => inboundHeaders.current,
}));

function inbound(requestId?: string): void {
  inboundHeaders.current = requestId
    ? new Headers({ [REQUEST_ID_HEADER]: requestId })
    : new Headers();
}

describe("withRouteLogging", () => {
  beforeEach(() => {
    inbound();
  });

  it("echoes the inbound request id on the response", async () => {
    inbound("abc-123");
    const handler = withRouteLogging("/api/probe", () => new Response(null, { status: 204 }));

    const response = await handler();

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe("abc-123");
  });

  it("mints an id when the caller sends none", async () => {
    const handler = withRouteLogging("/api/probe", () => new Response(null, { status: 204 }));

    const response = await handler();

    expect(response.headers.get(REQUEST_ID_HEADER)).toMatch(/^[0-9a-f]{32}$/);
  });

  it("exposes the id to the handler", async () => {
    inbound("abc-123");
    const handler = withRouteLogging("/api/probe", () => Response.json({ seen: getRequestId() }));

    const body = await (await handler()).json();

    expect(body).toEqual({ seen: "abc-123" });
  });

  it("takes the method from a request argument", async () => {
    const handler = withRouteLogging("/api/method-probe", (request: Request) =>
      Response.json({ method: request.method }),
    );

    await handler(new Request("http://test/api/method-probe", { method: "POST" }));

    expect(await renderMetrics()).toContain(
      'http_requests_total{method="POST",route="/api/method-probe",status="2xx"} 1',
    );
  });

  it("counts a failing handler as a 500 and rethrows", async () => {
    const handler = withRouteLogging("/api/crash-probe", () => {
      throw new Error("boom");
    });

    await expect(handler()).rejects.toThrow("boom");
    expect(await renderMetrics()).toContain(
      'http_requests_total{method="GET",route="/api/crash-probe",status="5xx"} 1',
    );
  });
});
