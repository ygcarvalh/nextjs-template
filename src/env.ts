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
    SERVICE_NAME: z.string().min(1).default("nextjs-template"),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
      .default("info"),
    LOG_FORMAT: z.enum(["json", "console"]).default("json"),
    LOG_FILE: z.string().min(1).optional(),
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
    SERVICE_NAME: process.env.SERVICE_NAME,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_FORMAT: process.env.LOG_FORMAT,
    LOG_FILE: process.env.LOG_FILE,
    METRICS_ENABLED: process.env.METRICS_ENABLED,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
