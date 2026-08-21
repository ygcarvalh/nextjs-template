import { beforeEach, describe, expect, it, vi } from "vitest";
import { listRequests } from "@/features/requests/server/requests";

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiGet }));

const filters = { outcome: null, path: null, requestId: null, cursor: null };

const row = {
  id: 1,
  request_id: "abc-123",
  method: "GET",
  path: "/api/v1/items",
  status_code: 200,
  duration_ms: 1.5,
  client_ip: "127.0.0.1",
  user_id: 7,
  created_at: "2026-08-20T12:00:00Z",
  outcome: "success",
};

describe("listRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for a bounded page and parses it", async () => {
    apiGet.mockResolvedValue({ items: [row], limit: 20, next_cursor: null });

    await expect(listRequests(filters)).resolves.toMatchObject({ next_cursor: null });
    expect(apiGet).toHaveBeenCalledWith("/requests?limit=20");
  });

  it("carries a cursor into the next page", async () => {
    apiGet.mockResolvedValue({ items: [row], limit: 20, next_cursor: "cur" });

    await expect(listRequests({ ...filters, cursor: "cur" })).resolves.toMatchObject({
      next_cursor: "cur",
    });
    expect(apiGet).toHaveBeenCalledWith("/requests?limit=20&cursor=cur");
  });

  it("returns nothing when the page is malformed", async () => {
    apiGet.mockResolvedValue({ items: [{ ...row, status_code: "200" }], limit: 20 });

    await expect(listRequests(filters)).resolves.toBeNull();
  });
});
