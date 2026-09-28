import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Light/dark theme with a "system" default. index.html applies the stored theme before
// React loads so there's no flash; this context keeps it in sync afterwards.

const STORAGE_KEY = "theme";
const ThemeContext = createContext(null);
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches);

  useEffect(() => {
    const query = darkQuery();
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((value) => {
    setThemeState(value);
    try {
      if (value === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage unavailable (private mode) — the choice still applies for this visit.
    }
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
