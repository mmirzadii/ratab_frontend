import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "dark" | "light";

export type UiState = {
  theme: ThemeMode;
  hasDismissedOnboarding: boolean;
  activeTourStep: number;
};

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem("ratab.theme");
  return storedTheme === "light" ? "light" : "dark";
}

function getInitialOnboardingDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem("ratab.onboarding.dismissed") === "true";
}

const initialState: UiState = {
  theme: getInitialTheme(),
  hasDismissedOnboarding: getInitialOnboardingDismissed(),
  activeTourStep: 0
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
      state.activeTourStep = Math.max(0, Math.min(action.payload, 2));
    },
    nextTourStep(state) {
      state.activeTourStep = Math.min(state.activeTourStep + 1, 2);
    },
    previousTourStep(state) {
      state.activeTourStep = Math.max(state.activeTourStep - 1, 0);
    },
    dismissOnboarding(state) {
      state.hasDismissedOnboarding = true;
    },
    resetOnboarding(state) {
      state.hasDismissedOnboarding = false;
      state.activeTourStep = 0;
    }
  }
});

export const {
  dismissOnboarding,
  nextTourStep,
  previousTourStep,
  resetOnboarding,
  setActiveTourStep,
  setTheme,
  toggleTheme
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
