import { createContext, useContext, useEffect, type ReactNode } from "react";

type Theme = "light";

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycle: () => void;
};

const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme: "light", setTheme: () => {}, cycle: () => {} }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
