import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/server";
import { notesService } from "@/features/notes/server";
import { createNoteSchema } from "@/features/notes/types";

// An HTTP adapter and nothing else: authenticate, parse, delegate, map the
// result to a status code. The rules live in the service.

function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  return NextResponse.json({ notes: await notesService.list(session) });
}

export async function POST(request: Request) {
  // Middleware already rejected anonymous requests. Re-checking here means a
  // middleware bypass still cannot write.
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const parsed = createNoteSchema.safeParse(await request.json());
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
