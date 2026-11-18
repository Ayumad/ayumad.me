import { useSyncExternalStore } from "react";
import { isRenderMode, type RenderMode } from "./renderMode";

type Theme = "light" | "dark";
const subscribers = new Set<() => void>();

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The DOM keeps the preference for the current visit.
  }
}

const dark = (): Theme => "dark";
const ascii = (): RenderMode => "ascii";

export function useThemePreference() {
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "light" ? "light" : "dark", dark);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    remember("ayumad-theme", next);
    subscribers.forEach((listener) => listener());
  }
  return { theme, toggleTheme };
}

export function useRendererPreference() {
  const renderMode = useSyncExternalStore(subscribe, () => {
    const mode = document.documentElement.dataset.renderer;
    return isRenderMode(mode) ? mode : "ascii";
  }, ascii);
  function setRenderMode(next: RenderMode) {
    document.documentElement.dataset.renderer = next;
    remember("ayumad-renderer", next);
    subscribers.forEach((listener) => listener());
  }
  return { renderMode, setRenderMode };
}
