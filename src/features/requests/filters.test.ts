import { describe, expect, it } from "vitest";
import { parseRequestFilters, toApiQuery, toQuery } from "@/features/requests/filters";

describe("parseRequestFilters", () => {
  it("defaults to an unfiltered first page", () => {
    expect(parseRequestFilters({})).toEqual({
      outcome: null,
      path: null,
      requestId: null,
      cursor: null,
    });
  });

  it("takes the values it knows", () => {
    expect(
      parseRequestFilters({
        outcome: "error",
        path: " /api/v1 ",
        request_id: "abc-123",
        cursor: "MjAyNi0wOC0yMXw0Mg==",
      }),
    ).toEqual({
      outcome: "error",
      path: "/api/v1",
      requestId: "abc-123",
      cursor: "MjAyNi0wOC0yMXw0Mg==",
    });
  });

  it("reads the first value of a repeated parameter", () => {
    expect(parseRequestFilters({ outcome: ["warning", "error"] }).outcome).toBe("warning");
  });

  it("drops an outcome it does not know", () => {
    expect(parseRequestFilters({ outcome: "sideways" }).outcome).toBeNull();
  });

  it("drops a forged correlation id", () => {
    expect(parseRequestFilters({ request_id: "abc 123\n" }).requestId).toBeNull();
  });

  it("drops an empty repeated parameter", () => {
    expect(parseRequestFilters({ outcome: [] }).outcome).toBeNull();
  });

  it.each(["../etc/passwd", "with spaces", "a".repeat(201)])(
    "drops a cursor shaped like %s",
    (cursor) => {
      expect(parseRequestFilters({ cursor }).cursor).toBeNull();
    },
  );
});

describe("toQuery", () => {
  it("omits everything that is unset", () => {
    expect(toQuery({ outcome: null, path: null, requestId: null, cursor: null })).toBe("");
  });

  it("round-trips through the parser", () => {
    const filters = {
      outcome: "warning" as const,
      path: "/api",
      requestId: "abc",
      cursor: "MjAyNi0wOC0yMXw0Mg==",
    };
    const query = toQuery(filters);

    expect(parseRequestFilters(Object.fromEntries(new URLSearchParams(query.slice(1))))).toEqual(
      filters,
    );
  });

  it("takes an override for the page", () => {
    expect(
      toQuery({ outcome: null, path: null, requestId: null, cursor: null }, { cursor: "abc" }),
    ).toBe("?cursor=abc");
  });

  it("drops the cursor when the override clears it", () => {
    expect(
      toQuery({ outcome: "error", path: null, requestId: null, cursor: "abc" }, { cursor: null }),
    ).toBe("?outcome=error");
  });
});

describe("toApiQuery", () => {
  it("always bounds the page", () => {
    expect(toApiQuery({ outcome: null, path: null, requestId: null, cursor: null })).toBe(
      "limit=20",
    );
  });

  it("passes the filters and the cursor through", () => {
    expect(toApiQuery({ outcome: "error", path: "/api/v1", requestId: "abc", cursor: "cur" })).toBe(
      "limit=20&outcome=error&path=%2Fapi%2Fv1&request_id=abc&cursor=cur",
    );
  });
});
