import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

async function loadRoute(metricsEnabled: string) {
  vi.resetModules();
  vi.stubEnv("METRICS_ENABLED", metricsEnabled);
  return import("@/app/api/metrics/route");
}

describe("metrics route handler", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("serves the registry in the prometheus text format", async () => {
    const { GET } = await loadRoute("true");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toContain("process_cpu_user_seconds_total");
  });

  it("withdraws the route when metrics are switched off", async () => {
    const { GET } = await loadRoute("false");

    expect((await GET()).status).toBe(404);
  });
});
