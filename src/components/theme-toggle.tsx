"use client";

import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

const STORAGE_KEY = "editory:theme";

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label="화면 테마 전환"
      className="theme-toggle"
      onClick={toggleTheme}
      title="화면 테마 전환"
      type="button"
    >
      <Moon aria-hidden="true" className="theme-toggle-dark-icon h-4 w-4" />
      <Sun aria-hidden="true" className="theme-toggle-light-icon h-4 w-4" />
      <span className="theme-toggle-dark-label">다크</span>
      <span className="theme-toggle-light-label">라이트</span>
    </button>
  );
}

function getCurrentTheme(): Theme {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
