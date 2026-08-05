import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // The demo repository is an in-process array shared by every request, so the
  // suite runs serially. A real datastore would lift this restriction.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Against the production build, not the dev server — middleware, headers,
    // and caching all behave differently there, and those are what we assert.
    command: `pnpm build && pnpm exec next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_URL: baseURL,
      SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-session-secret-at-least-32-characters",
      AUTH_DEMO_EMAIL: process.env.AUTH_DEMO_EMAIL ?? "demo@example.com",
      AUTH_DEMO_PASSWORD: process.env.AUTH_DEMO_PASSWORD ?? "demo-password",
    },
  },
});
