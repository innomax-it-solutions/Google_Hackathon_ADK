import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Unified theme context — exposes BOTH APIs so the chat components
// ({ isDark, toggle }) and the landing/auth components ({ theme, toggleTheme })
// work against the same provider.
const Ctx = createContext(null);

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("medbridge_theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("medbridge_theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <Ctx.Provider value={{ theme, isDark: theme === "dark", toggle, toggleTheme: toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
