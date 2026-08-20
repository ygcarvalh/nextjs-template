import "server-only";
import { Counter, collectDefaultMetrics, Histogram, Registry } from "prom-client";

export interface RequestSample {
  method: string;
  route: string;
  status: number;
  durationSeconds: number;
}

interface MetricsBundle {
  registry: Registry;
  requests: Counter<"method" | "route" | "status">;
  duration: Histogram<"method" | "route">;
}

// A module can be evaluated more than once in dev, and prom-client throws on a
// duplicate metric name, so the bundle lives on globalThis.
const globalMetrics = globalThis as typeof globalThis & {
  __templateMetrics?: MetricsBundle;
};

function build(): MetricsBundle {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  return {
    registry,
    requests: new Counter({
      name: "http_requests_total",
      help: "Requests served, by method, route and status class.",
      labelNames: ["method", "route", "status"],
      registers: [registry],
    }),
    duration: new Histogram({
      name: "http_request_duration_seconds",
      help: "Request duration in seconds.",
      labelNames: ["method", "route"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [registry],
    }),
  };
}

export function metrics(): MetricsBundle {
  globalMetrics.__templateMetrics ??= build();
  return globalMetrics.__templateMetrics;
}

export function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

export function recordRequest({ method, route, status, durationSeconds }: RequestSample): void {
  const { requests, duration } = metrics();
  requests.inc({ method, route, status: statusClass(status) });
  duration.observe({ method, route }, durationSeconds);
}

export async function renderMetrics(): Promise<string> {
  return metrics().registry.metrics();
}

export function metricsContentType(): string {
  return metrics().registry.contentType;
}
