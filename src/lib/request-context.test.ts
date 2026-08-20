import { describe, expect, it } from "vitest";
import { getRequestId, runWithRequestId } from "@/lib/request-context";

describe("request context", () => {
  it("has no id outside a scope", () => {
    expect(getRequestId()).toBeNull();
  });

  it("exposes the id inside the scope", () => {
    const seen = runWithRequestId("abc-123", () => getRequestId());
    expect(seen).toBe("abc-123");
  });

  it("keeps the id across an await boundary", async () => {
    const seen = await runWithRequestId("abc-123", async () => {
      await Promise.resolve();
      return getRequestId();
    });

    expect(seen).toBe("abc-123");
  });

  it("does not leak the id out of the scope", () => {
    runWithRequestId("abc-123", () => getRequestId());
    expect(getRequestId()).toBeNull();
  });

  it("keeps concurrent scopes apart", async () => {
    const [first, second] = await Promise.all([
      runWithRequestId("one", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return getRequestId();
      }),
      runWithRequestId("two", async () => getRequestId()),
    ]);

    expect(first).toBe("one");
    expect(second).toBe("two");
  });
});
