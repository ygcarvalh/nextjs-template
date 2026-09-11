import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/server";
import { ApiError, apiSend } from "@/lib/api-client";
import { readJsonBody } from "@/lib/http";
import { withRouteLogging } from "@/lib/with-route-logging";

const profileSchema = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().pipe(z.email()),
});

async function handlePatch(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = profileSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a name and an email address." }, { status: 400 });
  }

  try {
    await apiSend("PATCH", "/users/me", {
      email: parsed.data.email,
      name: parsed.data.name === "" ? null : parsed.data.name,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, request_id: error.requestId },
        { status: error.status },
      );
    }
    throw error;
  }

  return NextResponse.json({ saved: true });
}

export const PATCH = withRouteLogging("/api/account", handlePatch);
