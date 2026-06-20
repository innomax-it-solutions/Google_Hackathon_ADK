/**
 * Auth session storage — holds the JWT + user returned by the backend.
 *
 * The actual register/login network calls live in services/api.js; this module
 * only persists the resulting `{ token, user }` so the session survives reloads.
 * "Remember me" chooses localStorage (survives browser restarts) vs
 * sessionStorage (cleared on tab close); the other store is always cleared so
 * the two never disagree.
 */

const AUTH_KEY = "medbridge-auth";

/** Read the persisted session ({ token, user }) from local or session storage. */
export function readStoredAuth() {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(AUTH_KEY) ||
      window.sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.token && parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

/** The bare JWT, for the Authorization header on authenticated requests. */
export function getToken() {
  return readStoredAuth()?.token || null;
}

/** Persist the session. `remember` → localStorage, else sessionStorage. */
export function writeStoredAuth(session, remember) {
  if (typeof window === "undefined") return;
  const primary = remember ? window.localStorage : window.sessionStorage;
  const secondary = remember ? window.sessionStorage : window.localStorage;
  primary.setItem(AUTH_KEY, JSON.stringify(session));
  secondary.removeItem(AUTH_KEY);
}

/** Clear the session from both stores. */
export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage.removeItem(AUTH_KEY);
}
