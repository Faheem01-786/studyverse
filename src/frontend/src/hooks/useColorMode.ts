import { useCallback, useEffect, useState } from "react";

export type ColorMode = "light" | "dark";

const STORAGE_KEY = "grimoire-color-mode";

function readStoredMode(): ColorMode {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/**
 * Light/dark mode with persistence. The chosen mode is written to
 * localStorage and reflected on `<html class="dark">` so Tailwind's
 * class-based dark mode and the `color-scheme` property stay in sync.
 */
export function useColorMode() {
  const [mode, setMode] = useState<ColorMode>(readStoredMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { mode, setMode, toggle };
}
