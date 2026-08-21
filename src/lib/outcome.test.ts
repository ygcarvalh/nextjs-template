import { describe, expect, it } from "vitest";
import { outcomeOf } from "@/lib/outcome";

describe("outcomeOf", () => {
  it.each([
    [200, "success"],
    [204, "success"],
    [301, "success"],
    [399, "success"],
    [400, "warning"],
    [404, "warning"],
    [422, "warning"],
    [499, "warning"],
    [500, "error"],
    [503, "error"],
    [0, "error"],
  ])("calls %i a %s", (status, expected) => {
    expect(outcomeOf(status)).toBe(expected);
  });
});
