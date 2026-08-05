import type { Session } from "@/features/auth/types";

export type SessionIdentity = Pick<Session, "userId" | "email">;

// The port. Everything downstream depends on this interface, never on an
// implementation, so replacing the adapter is a one-line change in session.ts.
export interface SessionProvider {
  read(): Promise<Session | null>;
  create(identity: SessionIdentity): Promise<void>;
  destroy(): Promise<void>;
}
