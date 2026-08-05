import type { Note } from "@/features/notes/types";

export type NewNote = Pick<Note, "ownerId" | "text">;

// The port. The service depends on this, never on a concrete store, so moving
// to Postgres means adding an adapter and changing one binding in index.ts.
export interface NotesRepository {
  listByOwner(ownerId: string): Promise<Note[]>;
  countByOwner(ownerId: string): Promise<number>;
  add(note: NewNote): Promise<Note>;
}
