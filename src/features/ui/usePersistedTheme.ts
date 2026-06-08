import { useEffect } from "react";

import type { ThemeMode } from "./uiSlice";

export function usePersistedUiState(theme: ThemeMode, hasDismissedOnboarding: boolean) {
  useEffect(() => {
    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("metril.theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(
      "metril.onboarding.dismissed",
      String(hasDismissedOnboarding)
    );
  }, [hasDismissedOnboarding]);
}
