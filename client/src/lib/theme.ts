import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "fayaflex_theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
}

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

function applyTheme(mode: ThemeMode) {
  const resolved = resolve(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function getStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {}
  return "system";
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent("fayaflex:themechange", { detail: mode }));
}

export function initTheme() {
  applyTheme(getStoredTheme());
  if (typeof window !== "undefined" && window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mql.addEventListener?.("change", handler);
  }
}

export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredTheme());
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as ThemeMode;
      setModeState(detail);
    };
    window.addEventListener("fayaflex:themechange", onChange);
    return () => window.removeEventListener("fayaflex:themechange", onChange);
  }, []);
  return [mode, (m: ThemeMode) => setTheme(m)];
}
