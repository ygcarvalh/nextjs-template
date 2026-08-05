import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BROWSER_FLOW_COUNT,
  COVERAGE_FLOOR_PERCENT,
  verificationGates,
} from "@/features/verification/gates";
import { securityHeaders } from "@/lib/security-headers";

function repoFile(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url)), "utf8");
}

function gate(label: string) {
  const found = verificationGates.find((entry) => entry.label === label);
  if (!found) {
    throw new Error(`No gate labelled "${label}"`);
  }
  return found;
}

describe("verification gates", () => {
  it("advertises the coverage floor that vitest actually enforces", () => {
    const config = repoFile("vitest.config.ts");
    const lines = config.match(/lines:\s*(\d+)/);

    expect(lines?.[1]).toBe(String(COVERAGE_FLOOR_PERCENT));
    expect(gate("Coverage floor").value).toBe(`${COVERAGE_FLOOR_PERCENT}%`);
  });

  it("advertises the number of browser flows that exist", () => {
    const spec = repoFile("e2e/notes.spec.ts");
    const declared = spec.match(/^test\(/gm)?.length ?? 0;

    expect(declared).toBe(BROWSER_FLOW_COUNT);
    expect(gate("Browser flows").value).toBe(String(BROWSER_FLOW_COUNT));
  });

  it("advertises the number of headers actually sent", () => {
    expect(gate("Response headers").value).toBe(String(securityHeaders.length));
    expect(securityHeaders.length).toBeGreaterThanOrEqual(6);
  });

  it("only claims zero advisories while CI fails on a moderate one", () => {
    const workflow = repoFile(".github/workflows/ci.yml");

    expect(workflow).toContain("pnpm audit --prod --audit-level moderate");
    expect(gate("Known advisories").value).toBe("0");
  });

  it("points every gate at a file that exists", () => {
    for (const entry of verificationGates) {
      expect(() => repoFile(entry.source)).not.toThrow();
    }
  });

  it("gives every gate a runnable command", () => {
    for (const entry of verificationGates) {
      expect(entry.command.trim().length).toBeGreaterThan(0);
    }
  });
});
