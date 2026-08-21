import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookieJar, headerBag, mockNextHeaders } from "../../test/next-headers";

const getRequestId = vi.fn<() => string | null>();

vi.mock("@/lib/request-context", () => ({ getRequestId }));

async function load(header: string | null) {
  vi.resetModules();
  mockNextHeaders(cookieJar(), headerBag(header ? { "x-request-id": header } : {}));
  return (await import("@/lib/request-id-server")).outboundRequestId;
}

describe("outboundRequestId", () => {
  beforeEach(() => {
    getRequestId.mockReset();
  });

  it("prefers the id a route handler is running under", async () => {
    getRequestId.mockReturnValue("from-storage");
    const outboundRequestId = await load("from-header");

    await expect(outboundRequestId()).resolves.toBe("from-storage");
  });

  it("falls back to the header the middleware forwarded", async () => {
    getRequestId.mockReturnValue(null);
    const outboundRequestId = await load("from-header");

    await expect(outboundRequestId()).resolves.toBe("from-header");
  });

  it("refuses a forged header", async () => {
    getRequestId.mockReturnValue(null);
    const outboundRequestId = await load("not a valid id");

    await expect(outboundRequestId()).resolves.toBeNull();
  });

  it("returns null when nothing carries one", async () => {
    getRequestId.mockReturnValue(null);
    const outboundRequestId = await load(null);

    await expect(outboundRequestId()).resolves.toBeNull();
  });
});
