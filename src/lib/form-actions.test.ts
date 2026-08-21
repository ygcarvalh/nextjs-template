import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-client";
import { failure } from "@/lib/form-actions";

describe("failure", () => {
  it("uses the API's own words and keeps the id", () => {
    expect(failure(new ApiError(409, "Email already registered", "abc-123"), "fallback")).toEqual({
      error: "Email already registered",
      requestId: "abc-123",
    });
  });

  it("falls back for anything else", () => {
    expect(failure(new Error("connection refused"), "fallback")).toEqual({
      error: "fallback",
      requestId: null,
    });
  });
});
