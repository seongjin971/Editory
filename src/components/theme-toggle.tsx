import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  return (
    <button
      aria-label="화면 테마 전환"
      className="theme-toggle"
      data-theme-toggle
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
