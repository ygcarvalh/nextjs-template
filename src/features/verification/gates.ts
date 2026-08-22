import type { Dictionary } from "@/i18n/dictionary";
import { securityHeaders } from "@/lib/security-headers";

export interface VerificationGate {
  labelKey: keyof Dictionary["verification"];
  command: string;
  value: string;
  source: string;
}

export const COVERAGE_FLOOR_PERCENT = 95;
export const BROWSER_FLOW_COUNT = 27;

export const verificationGates: VerificationGate[] = [
  {
    labelKey: "types",
    command: "pnpm typecheck",
    value: "strict",
    source: "tsconfig.json",
  },
  {
    labelKey: "lint",
    command: "pnpm lint",
    value: "clean",
    source: "biome.json",
  },
  {
    labelKey: "coverage",
    command: "pnpm test:coverage",
    value: `${COVERAGE_FLOOR_PERCENT}%`,
    source: "vitest.config.ts",
  },
  {
    labelKey: "browserFlows",
    command: "pnpm test:e2e",
    value: String(BROWSER_FLOW_COUNT),
    source: "playwright.config.ts",
  },
  {
    labelKey: "responseHeaders",
    command: "curl -I localhost:3000",
    value: String(securityHeaders.length),
    source: "src/lib/security-headers.ts",
  },
  {
    labelKey: "advisories",
    command: "pnpm audit --prod",
    value: "0",
    source: "CONTRIBUTING.md",
  },
];
