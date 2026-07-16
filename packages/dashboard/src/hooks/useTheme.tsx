import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("ding-theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycle: () => void;
};

const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const mqRef = window.matchMedia("(prefers-color-scheme: dark)");

  function setTheme(t: Theme) {
    try { localStorage.setItem("ding-theme", t); } catch {}
    setThemeState(t);
    document.documentElement.dataset.theme = resolveTheme(t);
  }

  function cycle() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(theme);
    const handler = () => {
      if (theme === "system") document.documentElement.dataset.theme = resolveTheme("system");
    };
    mqRef.addEventListener("change", handler);
    return () => mqRef.removeEventListener("change", handler);
  }, [theme, mqRef]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
