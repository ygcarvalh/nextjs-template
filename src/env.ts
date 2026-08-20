import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  server: {
    SESSION_SECRET: z.string().min(32),
    AUTH_DEMO_EMAIL: z.email(),
    AUTH_DEMO_PASSWORD: z.string().min(8),
    METRICS_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SESSION_SECRET: process.env.SESSION_SECRET,
    AUTH_DEMO_EMAIL: process.env.AUTH_DEMO_EMAIL,
    AUTH_DEMO_PASSWORD: process.env.AUTH_DEMO_PASSWORD,
    METRICS_ENABLED: process.env.METRICS_ENABLED,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
