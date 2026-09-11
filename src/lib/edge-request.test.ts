import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientAddress, logRequestReceived } from "@/lib/edge-request";

function request(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`), { headers });
}

describe("clientAddress", () => {
  it("takes the first hop of x-forwarded-for", () => {
    expect(clientAddress(request("/", { "x-forwarded-for": "10.0.0.9, 10.0.0.1" }))).toBe(
      "10.0.0.9",
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientAddress(request("/", { "x-real-ip": "10.0.0.13" }))).toBe("10.0.0.13");
  });

  it("names an unknown caller rather than throwing", () => {
    expect(clientAddress(request("/"))).toBe("unknown");
  });
});

describe("logRequestReceived", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes one JSON line carrying the correlation id", () => {
    logRequestReceived(request("/notes", { "x-real-ip": "10.0.0.13" }), "abc-123");

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(vi.mocked(console.log).mock.calls[0][0] as string)).toMatchObject({
      event: "request.received",
      method: "GET",
      path: "/notes",
      client_ip: "10.0.0.13",
      request_id: "abc-123",
      level: "info",
    });
  });

  it.each(["/api/health", "/api/metrics"])("stays quiet for the %s probe", (path) => {
    logRequestReceived(request(path), "abc-123");

    expect(console.log).not.toHaveBeenCalled();
  });
});
