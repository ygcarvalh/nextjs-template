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
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/components/ui/**",
        "src/**/index.ts",
        "src/app/**/{page,layout,loading,error,global-error,not-found}.tsx",
        "src/app/**/{robots,sitemap}.ts",
        "src/features/auth/server/auth-actions.ts",
        "src/features/auth/components/sign-out-button.tsx",
        "src/components/theme-provider.tsx",
      ],
      thresholds: {
        lines: 95,
        functions: 100,
        branches: 90,
        statements: 95,
      },
    },
    env: {
      SESSION_SECRET: "test-session-secret-at-least-32-characters",
      AUTH_DEMO_EMAIL: "demo@example.com",
      AUTH_DEMO_PASSWORD: "demo-password",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      LOG_LEVEL: "silent",
    },
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
