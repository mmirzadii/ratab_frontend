import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "dark" | "light";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

export type UiState = {
  theme: ThemeMode;
  hasDismissedOnboarding: boolean;
  activeTourStep: number;
  toasts: Toast[];
};

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme =
    window.localStorage.getItem("metril.theme") ?? window.localStorage.getItem("ratab.theme");
  return storedTheme === "light" ? "light" : "dark";
}

function getInitialOnboardingDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem("metril.onboarding.dismissed") ??
    window.localStorage.getItem("ratab.onboarding.dismissed")
  ) === "true";
}

const initialState: UiState = {
  theme: getInitialTheme(),
  hasDismissedOnboarding: getInitialOnboardingDismissed(),
  activeTourStep: 0,
  toasts: []
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setActiveTourStep(state, action: PayloadAction<number>) {
      state.activeTourStep = Math.max(0, Math.min(action.payload, 6));
    },
    nextTourStep(state) {
      state.activeTourStep = Math.min(state.activeTourStep + 1, 6);
    },
    previousTourStep(state) {
      state.activeTourStep = Math.max(state.activeTourStep - 1, 0);
    },
    setOnboardingDismissed(state, action: PayloadAction<boolean>) {
      state.hasDismissedOnboarding = action.payload;
      if (!action.payload) {
        state.activeTourStep = 0;
      }
    },
    dismissOnboarding(state) {
      state.hasDismissedOnboarding = true;
    },
    resetOnboarding(state) {
      state.hasDismissedOnboarding = false;
      state.activeTourStep = 0;
    },
    addToast(state, action: PayloadAction<{ message: string; type: ToastType }>) {
      state.toasts.push({ ...action.payload, id: crypto.randomUUID() });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    }
  }
});

export const {
  addToast,
  dismissOnboarding,
  nextTourStep,
  previousTourStep,
  removeToast,
  resetOnboarding,
  setActiveTourStep,
  setOnboardingDismissed,
  setTheme,
  toggleTheme
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
