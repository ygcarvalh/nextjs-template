import type { Note } from "@/features/notes/types";

export type NewNote = Pick<Note, "ownerId" | "text">;

export interface NotesRepository {
  listByOwner(ownerId: string): Promise<Note[]>;
  countByOwner(ownerId: string): Promise<number>;
  add(note: NewNote): Promise<Note>;
}
