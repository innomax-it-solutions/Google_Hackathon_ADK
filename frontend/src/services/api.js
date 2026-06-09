/**
 * services/api.js — Thin adapter between React hooks and the AI provider.
 *
 * Components and hooks import from here, not from services/ai directly.
 * Swapping providers only requires changing services/ai/provider.js.
 */

import { streamChat, streamIntake, estimateHospital } from "./ai/provider";

/** WebSocket URL for live voice transcription. */
export { transcribeSocketUrl } from "./ai/provider";

export function sendChatMessage(sessionId, message, language, handlers) {
  return streamChat({ sessionId, message, language }, handlers);
}

/** Submit the structured intake form (Hospital Finder) → streamed Journey Plan. */
export function submitIntakeForm(intake, handlers) {
  return streamIntake(intake, handlers);
}

// --- /estimate_hospital response cache -------------------------------------
// The interactive card re-costs the non-recommended hospitals (and their flights)
// via /estimate_hospital. That result used to live only in the card's local state,
// so navigating away and back (or refreshing) re-fetched everything. Cache it by
// request params in sessionStorage: survives refresh + in-app navigation within the
// tab, but clears when the tab closes so fares don't go stale across sessions.

const _estimateCache = new Map();
const _ESTIMATE_SS_KEY = "medbridge_estimate_cache_v1";

(function hydrateEstimateCache() {
  try {
    const raw = sessionStorage.getItem(_ESTIMATE_SS_KEY);
    if (raw) for (const [k, v] of Object.entries(JSON.parse(raw))) _estimateCache.set(k, v);
  } catch { /* ignore parse/availability errors */ }
})();

function _estimateKey(p = {}) {
  return JSON.stringify([
    p.hospital_id || "", p.procedure || "", p.origin_country || "",
    p.origin_airport || "", p.departure_date || "", p.return_date || "",
    p.adults ?? 1, p.children ?? 0, p.infants ?? 0, p.cabin_class ?? 2,
    !!p.skip_flights,
  ]);
}

function _persistEstimateCache() {
  try {
    sessionStorage.setItem(_ESTIMATE_SS_KEY, JSON.stringify(Object.fromEntries(_estimateCache)));
  } catch { /* ignore quota errors */ }
}

/** Synchronous cache peek — returns the cached { cost, flights } or null. Lets the
 *  card seed its initial state on mount so cached hospitals never re-show a spinner. */
export function getCachedHospitalEstimate(params) {
  return _estimateCache.get(_estimateKey(params)) || null;
}

/** Re-cost one hospital (plan + cost + flights) on demand for the interactive card.
 *  Cached by params so remounts (nav back / refresh) don't re-hit the network. */
export async function fetchHospitalEstimate(params, signal) {
  const key = _estimateKey(params);
  const hit = _estimateCache.get(key);
  if (hit) return hit;
  const result = await estimateHospital(params, signal);
  _estimateCache.set(key, result);
  _persistEstimateCache();
  return result;
}
