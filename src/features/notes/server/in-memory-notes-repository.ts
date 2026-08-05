import type { NotesRepository } from "@/features/notes/server/notes-repository";
import type { Note } from "@/features/notes/types";

export function createInMemoryNotesRepository(seed: readonly Note[] = []): NotesRepository {
  const notes: Note[] = [...seed];

  return {
    async listByOwner(ownerId) {
      return notes.filter((note) => note.ownerId === ownerId).reverse();
    },

    async countByOwner(ownerId) {
      return notes.reduce((total, note) => (note.ownerId === ownerId ? total + 1 : total), 0);
    },

    async add(note) {
      const created: Note = {
        ...note,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      notes.push(created);
      return created;
    },
  };
}
