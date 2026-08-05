import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    env: {
      SESSION_SECRET: "test-session-secret-at-least-32-characters",
      AUTH_DEMO_EMAIL: "demo@example.com",
      AUTH_DEMO_PASSWORD: "demo-password",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
    // Extension picks the environment: `.test.ts` is server code and runs in
    // node, `.test.tsx` renders components and runs in jsdom. Server modules
    // must not see a `window` — @t3-oss/env-nextjs uses it to decide whether
    // server variables are readable.
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
