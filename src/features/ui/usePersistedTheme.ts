import { useEffect, useMemo, useRef } from "react";

import { useAppDispatch } from "../../app/hooks";
import { setOnboardingDismissed, type ThemeMode } from "./uiSlice";

function getOnboardingStorageKey(userKey: string | null | undefined) {
  return userKey
    ? `metril.onboarding.dismissed.${userKey}`
    : "metril.onboarding.dismissed.anonymous";
}

export function usePersistedUiState(
  theme: ThemeMode,
  hasDismissedOnboarding: boolean,
  userKey?: string | null
) {
  const dispatch = useAppDispatch();
  const skipNextOnboardingPersist = useRef(false);
  const onboardingStorageKey = useMemo(
    () => getOnboardingStorageKey(userKey),
    [userKey]
  );

  useEffect(() => {
    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("metril.theme", theme);
  }, [theme]);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(onboardingStorageKey);
    skipNextOnboardingPersist.current = true;
    dispatch(setOnboardingDismissed(storedValue === "true"));
  }, [dispatch, onboardingStorageKey]);

  useEffect(() => {
    if (skipNextOnboardingPersist.current) {
      skipNextOnboardingPersist.current = false;
      return;
    }

    window.localStorage.setItem(
      onboardingStorageKey,
      String(hasDismissedOnboarding)
    );
  }, [hasDismissedOnboarding, onboardingStorageKey]);
}
