import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/support";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "signed-out",
      testMatch: /signed-out\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "signed-in",
      testMatch: /signed-in\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_URL: baseURL,
      API_URL: process.env.API_URL ?? "http://127.0.0.1:8000/api/v1",
      FEATURE_FLAGS: process.env.FEATURE_FLAGS ?? "notes",
    },
  },
});
