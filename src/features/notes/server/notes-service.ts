import type { Session } from "@/features/auth/types";
import type { NotesRepository } from "@/features/notes/server/notes-repository";
import type { CreateNoteInput, Note } from "@/features/notes/types";

export const MAX_NOTES_PER_OWNER = 50;

export type CreateNoteResult =
  | { ok: true; note: Note }
  | { ok: false; reason: "limit-reached"; limit: number };

export interface NotesService {
  list(session: Session): Promise<Note[]>;
  create(session: Session, input: CreateNoteInput): Promise<CreateNoteResult>;
}

export function createNotesService(repository: NotesRepository): NotesService {
  return {
    list(session) {
      return repository.listByOwner(session.userId);
    },

    async create(session, input) {
      const existing = await repository.countByOwner(session.userId);
      if (existing >= MAX_NOTES_PER_OWNER) {
        return { ok: false, reason: "limit-reached", limit: MAX_NOTES_PER_OWNER };
      }

      const note = await repository.add({ ownerId: session.userId, text: input.text });
      return { ok: true, note };
    },
  };
}
