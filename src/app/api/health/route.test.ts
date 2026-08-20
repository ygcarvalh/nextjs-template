import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

describe("health route handler", () => {
  it("GET returns ok", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });
});
