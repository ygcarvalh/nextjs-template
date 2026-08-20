import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/server";
import { notesService } from "@/features/notes/server";
import { createNoteSchema } from "@/features/notes/types";
import { readJsonBody } from "@/lib/http";
import { withRouteLogging } from "@/lib/with-route-logging";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

async function handleGet() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  return NextResponse.json({ notes: await notesService.list(session) });
}

async function handlePost(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = createNoteSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid note", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const result = await notesService.create(session, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: `You can keep at most ${result.limit} notes.` },
      { status: 409 },
    );
  }

  return NextResponse.json({ note: result.note }, { status: 201 });
}

export const GET = withRouteLogging("/api/notes", handleGet);
export const POST = withRouteLogging("/api/notes", handlePost);
