import { useEffect } from "react";

import type { ThemeMode } from "./uiSlice";

export function usePersistedTheme(theme: ThemeMode) {
  useEffect(() => {
    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("ratab.theme", theme);
  }, [theme]);
}
