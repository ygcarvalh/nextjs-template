import type { Credentials, Session } from "@/features/auth/types";

export interface SessionProvider {
  read(): Promise<Session | null>;
  create(credentials: Credentials): Promise<Session | null>;
  destroy(): Promise<void>;
}
