import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/server";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/types";
import { ApiError, apiSend } from "@/lib/api-client";
import { readJsonBody } from "@/lib/http";
import { withRouteLogging } from "@/lib/with-route-logging";

const changeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH),
    confirmation: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmation, { path: ["confirmation"] });

async function handlePost(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = changeSchema.safeParse(body.value);
  if (!parsed.success) {
    // The form checks the same two rules before it gets here; this is the check
    // that holds when something else calls the endpoint.
    return NextResponse.json(
      {
        error: `Enter the current password and a new one of at least ${MIN_PASSWORD_LENGTH} characters, twice.`,
      },
      { status: 400 },
    );
  }

  try {
    await apiSend("POST", "/auth/password", {
      current_password: parsed.data.currentPassword,
      new_password: parsed.data.newPassword,
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

  return NextResponse.json({ changed: true });
}

export const POST = withRouteLogging("/api/account/password", handlePost);
