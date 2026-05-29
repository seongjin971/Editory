export type ThemePreference = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "editory:theme";
export const THEME_CHANGE_EVENT = "editory:theme-change";

export function loadThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore storage read failures
  }

  return "system";
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore storage write failures
  }
}

export function resolveTheme(preference: ThemePreference): "dark" | "light" {
  if (preference === "dark" || preference === "light") {
    return preference;
  }

  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const resolved = resolveTheme(preference);

  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: { preference, resolvedTheme: resolved },
      }),
    );
  }
}
