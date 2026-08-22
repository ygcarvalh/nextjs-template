import type { Credentials, Refusal, Registration, Session } from "@/features/auth/types";

export interface SessionProvider {
  read(): Promise<Session | null>;
  create(credentials: Credentials): Promise<Session | null>;
  register(registration: Registration): Promise<Session | { refused: Refusal }>;
  destroy(): Promise<void>;
}
