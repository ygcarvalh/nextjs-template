import "server-only";
import type { Note } from "@/features/notes/types";

const notes: Note[] = [];

export function listNotes(): Note[] {
  return [...notes].reverse();
}

export function addNote(text: string): Note {
  const note: Note = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  return note;
}

export function resetNotes(): void {
  notes.length = 0;
}
