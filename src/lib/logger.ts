import "server-only";
import { createRequire } from "node:module";
import pino, { type DestinationStream, type Logger } from "pino";
import { env } from "@/env";
import { getRequestId } from "@/lib/request-context";

const STDOUT_FD = 1;

// pino-pretty is a dev dependency, so it is loaded only when asked for.
function prettyStream(): DestinationStream {
  const require = createRequire(import.meta.url);
  const pretty = require("pino-pretty") as (options: object) => DestinationStream;
  return pretty({ colorize: true, ignore: "pid,hostname", messageKey: "event" });
}

function destination(): DestinationStream {
  const primary =
    env.LOG_FORMAT === "console"
      ? prettyStream()
      : pino.destination({ dest: STDOUT_FD, sync: true });

  if (!env.LOG_FILE) {
    return primary;
  }

  return pino.multistream([
    { stream: primary },
    { stream: pino.destination({ dest: env.LOG_FILE, mkdir: true, sync: true }) },
  ]);
}

function create(): Logger {
  return pino(
    {
      level: env.LOG_LEVEL,
      messageKey: "event",
      base: { service: env.SERVICE_NAME },
      formatters: { level: (label) => ({ level: label }) },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      mixin() {
        const requestId = getRequestId();
        return requestId ? { request_id: requestId } : {};
      },
    },
    destination(),
  );
}

export const logger: Logger = create();
