import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  server: {
    API_URL: z.url(),
    API_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    FEATURE_FLAGS: z.string().default("notes"),
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
    API_URL: process.env.API_URL,
    API_TIMEOUT_MS: process.env.API_TIMEOUT_MS,
    FEATURE_FLAGS: process.env.FEATURE_FLAGS,
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
