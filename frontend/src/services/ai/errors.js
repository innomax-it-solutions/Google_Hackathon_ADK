/**
 * AI error classification.
 *
 * The streaming layer emits structured error objects: { code, status?, message }.
 * This module turns those into user-friendly UI strings without exposing
 * implementation details (HTTP status codes, provider error names, etc.).
 */

export const ErrorCode = /** @type {const} */ ({
  NETWORK:    "NETWORK",    // fetch() failed — no internet / CORS / DNS
  AUTH:       "AUTH",       // 401 / 403 — bad or missing API key
  RATE_LIMIT: "RATE_LIMIT", // 429 — too many requests
  SERVER:     "SERVER",     // 5xx — backend / Gemini internal error
  STREAM:     "STREAM",     // ReadableStream interrupted mid-response
  CANCELLED:  "CANCELLED",  // AbortController fired — user initiated
  UNKNOWN:    "UNKNOWN",    // anything else
});

/** Map an HTTP status code to an ErrorCode. */
export function classifyStatus(status) {
  if (status === 401 || status === 403) return ErrorCode.AUTH;
  if (status === 429)                   return ErrorCode.RATE_LIMIT;
  if (status >= 500)                    return ErrorCode.SERVER;
  return ErrorCode.UNKNOWN;
}

/** Return a user-facing sentence for a given ErrorCode. Returns null for CANCELLED (silent). */
export function friendlyError(code) {
  switch (code) {
    case ErrorCode.NETWORK:
      return "Cannot reach the MedBridge backend. Make sure the server is running (uvicorn backend.main:app) and try again.";
    case ErrorCode.AUTH:
      return "The AI service could not be authenticated. Please contact support.";
    case ErrorCode.RATE_LIMIT:
      return "Too many requests — please wait a moment before sending another message.";
    case ErrorCode.SERVER:
      return "The AI service encountered a temporary error. Please try again in a few seconds.";
    case ErrorCode.STREAM:
      return "The response was interrupted. Please try again.";
    case ErrorCode.CANCELLED:
      return null; // user-initiated — no UI message needed
    default:
      return "Something went wrong. Please try again.";
  }
}
