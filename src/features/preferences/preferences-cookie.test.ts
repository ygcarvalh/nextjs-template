import { describe, expect, it } from "vitest";
import {
  parseChromePreferences,
  serializeChromePreferences,
} from "@/features/preferences/preferences-cookie";

const DEFAULTS = { theme: "system", showRequestId: true };

describe("parseChromePreferences", () => {
  it("reads what was written", () => {
    const written = serializeChromePreferences({ theme: "dark", showRequestId: false });

    expect(parseChromePreferences(written)).toEqual({ theme: "dark", showRequestId: false });
  });

  it.each([undefined, "", "not json", "[]", "null"])("defaults for %o", (value) => {
    expect(parseChromePreferences(value)).toEqual(DEFAULTS);
  });

  it("keeps the half it understands", () => {
    expect(
      parseChromePreferences(JSON.stringify({ theme: "sepia", showRequestId: false })),
    ).toEqual({ theme: "system", showRequestId: false });
  });

  it("refuses a flag that is not a boolean", () => {
    expect(parseChromePreferences(JSON.stringify({ theme: "light", showRequestId: "no" }))).toEqual(
      {
        theme: "light",
        showRequestId: true,
      },
    );
  });
});
