/**
 * services/api.js — Thin adapter between React hooks and the AI provider.
 *
 * Components and hooks import from here, not from services/ai directly.
 * Swapping providers only requires changing services/ai/provider.js.
 */

import { streamChat } from "./ai/provider";

export function sendChatMessage(sessionId, message, handlers) {
  return streamChat({ sessionId, message }, handlers);
}
