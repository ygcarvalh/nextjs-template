import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");

function block(selector: string): string {
  const start = stylesheet.indexOf(`${selector} {`);
  return stylesheet.slice(start, stylesheet.indexOf("\n}", start));
}

describe("globals.css", () => {
  // Without color-scheme the browser paints native controls from the system
  // palette, which is how a dark page ends up with an unreadable select.
  it.each([
    [":root", "light"],
    [".dark", "dark"],
  ])("tells the browser %s is %s", (selector, scheme) => {
    expect(block(selector)).toContain(`color-scheme: ${scheme}`);
  });

  it.each([":root", ".dark"])("defines the warning colour in %s", (selector) => {
    expect(block(selector)).toContain("--warning:");
  });

  it("dresses option elements for the theme as well", () => {
    expect(block("select option")).toContain("var(--popover)");
  });

  it("stops animating when the reader asked it to", () => {
    expect(stylesheet).toContain("prefers-reduced-motion: reduce");
  });
});
