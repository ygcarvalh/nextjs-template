import { securityHeaders } from "@/lib/security-headers";

export interface VerificationGate {
  label: string;
  command: string;
  value: string;
  source: string;
}

export const COVERAGE_FLOOR_PERCENT = 95;
export const BROWSER_FLOW_COUNT = 7;

export const verificationGates: VerificationGate[] = [
  {
    label: "Types",
    command: "pnpm typecheck",
    value: "strict",
    source: "tsconfig.json",
  },
  {
    label: "Lint and format",
    command: "pnpm lint",
    value: "clean",
    source: "biome.json",
  },
  {
    label: "Coverage floor",
    command: "pnpm test:coverage",
    value: `${COVERAGE_FLOOR_PERCENT}%`,
    source: "vitest.config.ts",
  },
  {
    label: "Browser flows",
    command: "pnpm test:e2e",
    value: String(BROWSER_FLOW_COUNT),
    source: "e2e/notes.spec.ts",
  },
  {
    label: "Response headers",
    command: "curl -I localhost:3000",
    value: String(securityHeaders.length),
    source: "src/lib/security-headers.ts",
  },
  {
    label: "Known advisories",
    command: "pnpm audit --prod",
    value: "0",
    source: ".github/workflows/ci.yml",
  },
];
