import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestId<T>(requestId: string, callback: () => T): T {
  return storage.run({ requestId }, callback);
}

export function getRequestId(): string | null {
  return storage.getStore()?.requestId ?? null;
}
