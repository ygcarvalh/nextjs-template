import { NextResponse } from "next/server";
import { addNote, listNotes } from "@/features/notes/server/notes-store";
import { createNoteSchema } from "@/features/notes/types";

export function GET() {
  return NextResponse.json({ notes: listNotes() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  }
  const note = addNote(parsed.data.text);
  return NextResponse.json({ note }, { status: 201 });
}
