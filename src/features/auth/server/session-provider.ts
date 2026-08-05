import type { Session } from "@/features/auth/types";

export type SessionIdentity = Pick<Session, "userId" | "email">;

export interface SessionProvider {
  read(): Promise<Session | null>;
  create(identity: SessionIdentity): Promise<void>;
  destroy(): Promise<void>;
}
