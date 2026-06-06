import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  clearStoredAuth,
  credentialsConfigured,
  readStoredAuth,
  validateCredentials,
  writeStoredAuth,
} from "../utils/auth";

const AuthContext = createContext(null);

/**
 * Frontend-only auth state. `login` validates against the env credentials and,
 * on success, persists a session flag. No network calls are ever made.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth());

  const login = useCallback(async (email, password, remember = true) => {
    if (!credentialsConfigured()) {
      return {
        ok: false,
        error:
          "Demo credentials aren't configured. Add VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD to your .env file.",
      };
    }
    if (!validateCredentials(email, password)) {
      return { ok: false, error: "Invalid email or password. Please try again." };
    }
    const session = {
      email: email.trim(),
      name: "Healtour Admin",
      loginAt: new Date().toISOString(),
    };
    writeStoredAuth(session, remember);
    setUser(session);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
