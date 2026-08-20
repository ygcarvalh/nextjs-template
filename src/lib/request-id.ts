export const REQUEST_ID_HEADER = "x-request-id";
export const MAX_REQUEST_ID_LENGTH = 64;

const REQUEST_ID_PATTERN = new RegExp(`^[A-Za-z0-9_-]{1,${MAX_REQUEST_ID_LENGTH}}$`);

export function newRequestId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function sanitizeRequestId(value: string | null | undefined): string | null {
  if (!value || !REQUEST_ID_PATTERN.test(value)) {
    return null;
  }
  return value;
}

export function resolveRequestId(value: string | null | undefined): string {
  return sanitizeRequestId(value) ?? newRequestId();
}
