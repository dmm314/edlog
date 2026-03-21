"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";
export type DynamicIntensity = "calm" | "vibrant";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
  intensity: DynamicIntensity;
  setIntensity: (intensity: DynamicIntensity) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "edlog-theme";
const INTENSITY_STORAGE_KEY = "edlog-dynamic-intensity";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light") return "light";
  if (stored === "dark" || stored === "night") return "dark";
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function getStoredIntensity(): DynamicIntensity {
  if (typeof window === "undefined") return "vibrant";
  const stored = localStorage.getItem(INTENSITY_STORAGE_KEY);
  return stored === "calm" ? "calm" : "vibrant";
}

function applyDocumentTheme(theme: Theme, intensity: DynamicIntensity) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.intensity = intensity;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0d1117" : "#f0f2f5");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [intensity, setIntensityState] = useState<DynamicIntensity>("vibrant");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const storedIntensity = getStoredIntensity();
    setThemeState(storedTheme);
    setIntensityState(storedIntensity);
    applyDocumentTheme(storedTheme, storedIntensity);
    setMounted(true);
  }, []);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyDocumentTheme(nextTheme, intensity);
    },
    [intensity],
  );

  const setIntensity = useCallback(
    (nextIntensity: DynamicIntensity) => {
      setIntensityState(nextIntensity);
      localStorage.setItem(INTENSITY_STORAGE_KEY, nextIntensity);
      applyDocumentTheme(theme, nextIntensity);
    },
    [theme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme,
      intensity,
      setIntensity,
    }),
    [theme, setTheme, intensity, setIntensity],
  );

  if (!mounted) {
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
