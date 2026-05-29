import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Editory",
  description: "원고를 구조로 바꾸는 AI 스토리 분석 도구",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var key = "editory:theme";

  function readPreference() {
    try {
      var storedTheme = window.localStorage.getItem(key);
      return storedTheme === "dark" || storedTheme === "light" || storedTheme === "system"
        ? storedTheme
        : "system";
    } catch (_) {
      return "system";
    }
  }

  function resolveTheme(preference) {
    if (preference === "dark" || preference === "light") {
      return preference;
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(preference) {
    var theme = resolveTheme(preference);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  function savePreference(preference) {
    try {
      window.localStorage.setItem(key, preference);
    } catch (_) {}
  }

  function emitThemeChange(preference) {
    try {
      window.dispatchEvent(new CustomEvent("editory:theme-change", {
        detail: {
          preference: preference,
          resolvedTheme: resolveTheme(preference)
        }
      }));
    } catch (_) {}
  }

  applyTheme(readPreference());

  document.addEventListener("click", function (event) {
    var target = event.target;

    if (!target || !target.closest || !target.closest("[data-theme-toggle]")) {
      return;
    }

    var currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    var nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    savePreference(nextTheme);
    emitThemeChange(nextTheme);
  });
})();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
