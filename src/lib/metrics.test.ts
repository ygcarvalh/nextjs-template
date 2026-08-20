import { describe, expect, it } from "vitest";
import {
  metrics,
  metricsContentType,
  recordRequest,
  renderMetrics,
  statusClass,
} from "@/lib/metrics";

describe("statusClass", () => {
  it.each([
    [200, "2xx"],
    [404, "4xx"],
    [503, "5xx"],
  ])("maps %i to %s", (status, expected) => {
    expect(statusClass(status)).toBe(expected);
  });
});

describe("metrics", () => {
  it("reuses one registry across calls", () => {
    expect(metrics().registry).toBe(metrics().registry);
  });

  it("announces the prometheus text format", () => {
    expect(metricsContentType()).toContain("text/plain");
  });

  it("exposes the default process metrics", async () => {
    expect(await renderMetrics()).toContain("process_cpu_user_seconds_total");
  });
});

describe("recordRequest", () => {
  it("counts the request and observes its duration", async () => {
    recordRequest({
      method: "GET",
      route: "/api/probe",
      status: 201,
      durationSeconds: 0.02,
    });

    const body = await renderMetrics();

    expect(body).toContain('http_requests_total{method="GET",route="/api/probe",status="2xx"} 1');
    expect(body).toContain(
      'http_request_duration_seconds_count{method="GET",route="/api/probe"} 1',
    );
  });
});
