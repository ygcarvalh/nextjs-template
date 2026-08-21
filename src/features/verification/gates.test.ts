import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BROWSER_FLOW_COUNT,
  COVERAGE_FLOOR_PERCENT,
  verificationGates,
} from "@/features/verification/gates";
import { securityHeaders } from "@/lib/security-headers";

function repoPath(relativePath: string): string {
  return fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url));
}

function repoFile(relativePath: string): string {
  return readFileSync(repoPath(relativePath), "utf8");
}

function specFiles(directory: string): string[] {
  return readdirSync(repoPath(directory), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? specFiles(`${directory}/${entry.name}`)
      : entry.name.endsWith(".spec.ts")
        ? [`${directory}/${entry.name}`]
        : [],
  );
}

function gate(labelKey: string) {
  const found = verificationGates.find((entry) => entry.labelKey === labelKey);
  if (!found) {
    throw new Error(`No gate keyed "${labelKey}"`);
  }
  return found;
}

describe("verification gates", () => {
  it("advertises the coverage floor that vitest actually enforces", () => {
    const lines = repoFile("vitest.config.ts").match(/lines:\s*(\d+)/);

    expect(lines?.[1]).toBe(String(COVERAGE_FLOOR_PERCENT));
    expect(gate("coverage").value).toBe(`${COVERAGE_FLOOR_PERCENT}%`);
  });

  it("advertises the number of browser flows that exist", () => {
    const declared = specFiles("e2e")
      .map((file) => repoFile(file).match(/^test\(/gm)?.length ?? 0)
      .reduce((total, count) => total + count, 0);

    expect(declared).toBe(BROWSER_FLOW_COUNT);
    expect(gate("browserFlows").value).toBe(String(BROWSER_FLOW_COUNT));
  });

  it("advertises the number of headers actually sent", () => {
    expect(gate("responseHeaders").value).toBe(String(securityHeaders.length));
    expect(securityHeaders.length).toBeGreaterThanOrEqual(6);
  });

  it("only claims zero advisories while the documented command fails on one", () => {
    expect(repoFile("CONTRIBUTING.md")).toContain("pnpm audit --prod --audit-level moderate");
    expect(gate("advisories").value).toBe("0");
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
