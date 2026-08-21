export const OUTCOMES = ["success", "warning", "error"] as const;

export type Outcome = (typeof OUTCOMES)[number];

const CLIENT_ERROR_STATUS = 400;
const SERVER_ERROR_STATUS = 500;

// A rejected fetch has no status at all, and that is an error rather than a
// refusal, so 0 lands on the same branch as a 500.
export function outcomeOf(status: number): Outcome {
  if (status >= SERVER_ERROR_STATUS || status === 0) {
    return "error";
  }
  if (status >= CLIENT_ERROR_STATUS) {
    return "warning";
  }
  return "success";
}
