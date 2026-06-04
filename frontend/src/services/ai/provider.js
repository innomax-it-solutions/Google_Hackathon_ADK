/**
 * AI Provider — routes all chat traffic to the existing MedBridge FastAPI backend.
 *
 * Backend: FastAPI + Google ADK + Gemini 2.5 Flash  (backend/main.py)
 * Endpoint: POST /chat  →  SSE stream
 *
 * The Vite dev server proxies /chat → http://localhost:8000 automatically
 * (configured in vite.config.js). For production, set VITE_API_URL.
 *
 * To point at a different backend later:
 *   Change VITE_API_URL in .env — zero frontend code changes required.
 */

import { openSseStream } from "./streaming";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Stream a message to the backend and receive SSE events.
 * @returns {{ abort: () => void }}
 */
export function streamChat({ sessionId, message, language }, handlers) {
  return openSseStream(
    `${BASE_URL}/chat`,
    { session_id: sessionId, message, language },
    handlers
  );
}

/** Check if the backend is reachable. */
export async function healthCheck() {
  try {
    const res = await fetch(`${BASE_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
