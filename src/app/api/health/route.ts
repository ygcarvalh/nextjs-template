import { NextResponse } from "next/server";
import { withRouteLogging } from "@/lib/with-route-logging";

function handleGet() {
  return NextResponse.json({ status: "ok" });
}

export const GET = withRouteLogging("/api/health", handleGet);
