import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from "../utils/auth";
import { loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

/**
 * Auth state backed by the FastAPI /auth endpoints. `login`/`register` call the
 * backend, persist the returned { token, user }, and expose the user to the app.
 * The JWT is read from storage (utils/auth.getToken) wherever a request needs it.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth()?.user ?? null);

  const persist = useCallback((session, remember) => {
    writeStoredAuth(session, remember);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (email, password, remember = true) => {
      try {
        const session = await loginUser(email, password);
        persist(session, remember);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message || "Sign in failed. Please try again." };
      }
    },
    [persist]
  );

  const register = useCallback(
    async (payload, remember = true) => {
      try {
        const session = await registerUser(payload);
        persist(session, remember);
        return { ok: true, user: session.user };
      } catch (err) {
        return { ok: false, error: err.message || "Could not create your account." };
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
