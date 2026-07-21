import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("health route handler", () => {
  it("GET returns ok", async () => {
    const res = GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });
});
