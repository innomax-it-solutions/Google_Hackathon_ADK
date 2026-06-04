/**
 * services/api.js — Thin adapter between React hooks and the AI provider.
 *
 * Components and hooks import from here, not from services/ai directly.
 * Swapping providers only requires changing services/ai/provider.js.
 */

import { streamChat, streamIntake } from "./ai/provider";

export function sendChatMessage(sessionId, message, language, handlers) {
  return streamChat({ sessionId, message, language }, handlers);
}

/** Submit the structured intake form (Hospital Finder) → streamed Journey Plan. */
export function submitIntakeForm(intake, handlers) {
  return streamIntake(intake, handlers);
}
