import type { MatchResponse } from "./contracts";

// A retry names the exact saved attempt. Replayed requests cannot regenerate
// a newer result, and refresh continues to read the saved attempt.
export function canRetryMatch(match: MatchResponse | null, retryOf?: string) {
  return Boolean(
    match &&
    retryOf &&
    match.runId === retryOf &&
    !match.guidance &&
    (match.status === "unavailable" ||
      (match.status === "partial" && match.mode.explanation === "template")),
  );
}
