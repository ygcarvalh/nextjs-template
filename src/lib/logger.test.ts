import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

interface Entry {
  event: string;
  level: string;
  service: string;
  timestamp: string;
  request_id?: string;
}

function tempLogFile(): string {
  return join(mkdtempSync(join(tmpdir(), "logger-")), "nested", "web.jsonl");
}

async function loadLogger(overrides: Record<string, string>) {
  const logFile = tempLogFile();
  vi.resetModules();
  vi.stubEnv("LOG_LEVEL", "info");
  vi.stubEnv("LOG_FORMAT", "json");
  vi.stubEnv("SERVICE_NAME", "nextjs-template");
  vi.stubEnv("LOG_FILE", logFile);
  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value);
  }

  const [{ logger }, context] = await Promise.all([
    import("@/lib/logger"),
    import("@/lib/request-context"),
  ]);

  return {
    logger,
    context,
    read: (): Entry[] =>
      readFileSync(logFile, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Entry),
  };
}

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("writes one json object per call", async () => {
    const { logger, read } = await loadLogger({});

    logger.info({ path: "/notes" }, "request");
    const [entry] = read();

    expect(entry.event).toBe("request");
    expect(entry.level).toBe("info");
    expect(entry.service).toBe("nextjs-template");
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(entry.request_id).toBeUndefined();
  });

  it("carries the request id of the surrounding scope", async () => {
    const { logger, context, read } = await loadLogger({});

    context.runWithRequestId("abc-123", () => logger.info("request"));
    const [entry] = read();

    expect(entry.request_id).toBe("abc-123");
  });

  it("honors the configured level", async () => {
    const { logger, read } = await loadLogger({ LOG_LEVEL: "warn" });

    logger.info("quiet");
    logger.warn("loud");
    const events = read().map((entry) => entry.event);

    expect(events).toEqual(["loud"]);
  });

  it("still writes json to the file when the console format is on", async () => {
    const { logger, read } = await loadLogger({ LOG_FORMAT: "console" });

    logger.info("request");

    expect(read()[0].event).toBe("request");
  });

  it("writes to stdout alone when no log file is configured", async () => {
    vi.resetModules();
    vi.stubEnv("LOG_LEVEL", "silent");
    vi.stubEnv("LOG_FORMAT", "json");
    vi.stubEnv("LOG_FILE", "");

    const { logger } = await import("@/lib/logger");

    expect(() => logger.info("request")).not.toThrow();
  });
});
