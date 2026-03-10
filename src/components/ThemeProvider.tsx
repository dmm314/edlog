"use client";
 
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
 
export type Theme = "light" | "dark";
 
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}
 
const ThemeContext = createContext<ThemeContextValue | null>(null);
 
const STORAGE_KEY = "edlog-theme";
 
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light") return "light";
  if (stored === "dark" || stored === "night") return "dark"; // night → dark fallback
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}
 
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
 
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors: Record<Theme, string> = {
      light: "#FAFAF9",
      dark: "#1C1917",
    };
    meta.setAttribute("content", colors[theme]);
  }
}
 
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
 
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);
 
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);
 
  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", setTheme, resolvedTheme: "light" }}>
        {children}
      </ThemeContext.Provider>
    );
  }
 
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}
 
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
