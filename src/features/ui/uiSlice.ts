import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "dark" | "light";

export type UiState = {
  theme: ThemeMode;
};

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem("ratab.theme");
  return storedTheme === "light" ? "light" : "dark";
}

const initialState: UiState = {
  theme: getInitialTheme()
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
    }
  }
});

export const { setTheme, toggleTheme } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
