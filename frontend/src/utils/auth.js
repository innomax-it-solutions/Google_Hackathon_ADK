/**
 * Frontend-only demo authentication helpers.
 *
 * There is NO backend, API, JWT, or database here. The "login" simply
 * compares what the user typed against static credentials provided via Vite
 * environment variables, and persists a small flag in Web Storage so the
 * session survives reloads.
 */

// Vite exposes only VITE_-prefixed vars to client code. Read once at module load.
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "").trim();
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

const AUTH_KEY = "medbridge-auth";

/** True when demo credentials have been configured in the environment. */
export function credentialsConfigured() {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
}

/**
 * The configured demo credentials, used purely to offer a one-click
 * "fill demo credentials" affordance on the login screen. Values come from
 * the environment — they are never hardcoded in components.
 */
export function getDemoCredentials() {
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}

/** Case-insensitive email match; exact password match. */
export function validateCredentials(email, password) {
  const entered = (email ?? "").trim().toLowerCase();
  return entered === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
}

/** Read a persisted demo session from local or session storage (if any). */
export function readStoredAuth() {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(AUTH_KEY) ||
      window.sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Persist the demo session. When `remember` is true we use localStorage
 * (survives browser restarts); otherwise sessionStorage (cleared on tab close).
 * The other store is cleared so the two never disagree.
 */
export function writeStoredAuth(user, remember) {
  if (typeof window === "undefined") return;
  const primary = remember ? window.localStorage : window.sessionStorage;
  const secondary = remember ? window.sessionStorage : window.localStorage;
  primary.setItem(AUTH_KEY, JSON.stringify(user));
  secondary.removeItem(AUTH_KEY);
}

/** Clear the demo session from both stores. */
export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage.removeItem(AUTH_KEY);
}
