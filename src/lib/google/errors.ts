/**
 * Normalized error handling for all Google API clients.
 *
 * External failures (network, timeout, non-2xx, validation) are converted into
 * a single typed shape so route handlers can respond consistently and never
 * leak raw upstream payloads or secrets to the client.
 */

export type GoogleErrorCode =
  | "validation"
  | "upstream"
  | "timeout"
  | "rate_limited"
  | "network"
  | "unknown";

export class GoogleApiError extends Error {
  readonly code: GoogleErrorCode;
  readonly status: number;

  constructor(code: GoogleErrorCode, message: string, status: number) {
    super(message);
    this.name = "GoogleApiError";
    this.code = code;
    this.status = status;
  }
}

/** Safe, user-facing messages. They never include upstream detail. */
const SAFE_MESSAGES: Record<GoogleErrorCode, string> = {
  validation: "The request was invalid.",
  upstream: "The location service is temporarily unavailable.",
  timeout: "The location service took too long to respond.",
  rate_limited: "Too many requests. Please slow down and try again.",
  network: "Could not reach the location service.",
  unknown: "Something went wrong. Please try again.",
};

export function safeMessage(code: GoogleErrorCode): string {
  return SAFE_MESSAGES[code];
}

/** Maps any thrown value into a GoogleApiError without exposing internals. */
export function normalizeError(error: unknown): GoogleApiError {
  if (error instanceof GoogleApiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new GoogleApiError("timeout", safeMessage("timeout"), 504);
  }
  if (error instanceof TypeError) {
    // fetch throws TypeError on network failures.
    return new GoogleApiError("network", safeMessage("network"), 502);
  }
  return new GoogleApiError("unknown", safeMessage("unknown"), 500);
}
