import { NextResponse } from "next/server";

export const MAX_JSON_BODY_BYTES = 16 * 1024;

export type JsonBodyResult = { ok: true; value: unknown } | { ok: false; response: NextResponse };

function failure(error: string, status: number): JsonBodyResult {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

export async function readJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<JsonBodyResult> {
  const mediaType = (request.headers.get("content-type") ?? "").toLowerCase().split(";")[0].trim();
  if (mediaType !== "application/json" && !mediaType.endsWith("+json")) {
    return failure("Expected an application/json request body.", 415);
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return failure("Request body is too large.", 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return failure("Request body is too large.", 413);
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return failure("Request body is not valid JSON.", 400);
  }
}
