"use client";

import { useEffect, useState } from "react";
import {
  applyThemePreference,
  loadThemePreference,
  saveThemePreference,
  THEME_CHANGE_EVENT,
  type ThemePreference,
} from "@/lib/global-settings";

const options: Array<{ label: string; value: ThemePreference }> = [
  { label: "시스템 설정 따름", value: "system" },
  { label: "라이트", value: "light" },
  { label: "다크", value: "dark" },
];

export function ThemeSettingsSection() {
  const [preference, setPreference] = useState<ThemePreference>(() => loadThemePreference());

  useEffect(() => {
    function syncPreference(event: Event) {
      const nextPreference = (event as CustomEvent<{ preference?: ThemePreference }>).detail
        ?.preference;

      if (
        nextPreference === "dark" ||
        nextPreference === "light" ||
        nextPreference === "system"
      ) {
        setPreference(nextPreference);
        return;
      }

      setPreference(loadThemePreference());
    }

    window.addEventListener(THEME_CHANGE_EVENT, syncPreference);
    window.addEventListener("storage", syncPreference);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncPreference);
      window.removeEventListener("storage", syncPreference);
    };
  }, []);

  function handleChange(next: ThemePreference) {
    setPreference(next);
    saveThemePreference(next);
    applyThemePreference(next);
  }

  return (
    <section className="space-y-3 rounded-lg border border-[var(--line)] bg-white p-5">
      <div>
        <p className="text-sm font-semibold text-[#34413b]">화면 테마</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Editory 전체 화면에 적용됩니다. 우측 하단 토글과 동일한 설정입니다.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2.5 text-sm font-semibold"
            key={option.value}
          >
            <input
              checked={preference === option.value}
              className="h-4 w-4 accent-[var(--accent)]"
              name="theme-preference"
              onChange={() => handleChange(option.value)}
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </section>
  );
}
