"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getTheme, saveTheme, type ThemeId } from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("stoic");

  useEffect(() => {
    const storedTheme = getTheme();
    setThemeState(storedTheme);
    document.documentElement.dataset.theme = storedTheme;
  }, []);

  const setTheme = (nextTheme: ThemeId) => {
    setThemeState(nextTheme);
    saveTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
