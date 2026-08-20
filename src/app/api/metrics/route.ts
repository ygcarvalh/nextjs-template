import { NextResponse } from "next/server";
import { env } from "@/env";
import { metricsContentType, renderMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!env.METRICS_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(await renderMetrics(), {
    headers: { "Content-Type": metricsContentType() },
  });
}
