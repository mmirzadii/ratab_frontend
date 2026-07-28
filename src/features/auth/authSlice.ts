import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { clearLegacyAuthStorage } from "./csrf";
import type { AppUser } from "./authApi";

clearLegacyAuthStorage();

export type AuthStatus = "unknown" | "authenticated" | "anonymous";

type AuthState = {
  status: AuthStatus;
  user: AppUser | null;
  shouldHighlightCreateCompany: boolean;
};

const initialState: AuthState = {
  status: "unknown",
  user: null,
  shouldHighlightCreateCompany: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionRestored(state, action: PayloadAction<AppUser>) {
      state.status = "authenticated";
      state.user = action.payload;
    },
    sessionAuthenticated(
      state,
      action: PayloadAction<{ user: AppUser; highlightCreateCompany?: boolean }>
    ) {
      state.status = "authenticated";
      state.user = action.payload.user;
      state.shouldHighlightCreateCompany = Boolean(action.payload.highlightCreateCompany);
    },
    sessionMissing(state) {
      state.status = "anonymous";
      state.user = null;
    },
    setCurrentUser(state, action: PayloadAction<AppUser>) {
      state.status = "authenticated";
      state.user = action.payload;
    },
    clearCreateCompanyHighlight(state) {
      state.shouldHighlightCreateCompany = false;
    },
    logout(state) {
      state.status = "anonymous";
      state.user = null;
      state.shouldHighlightCreateCompany = false;
      clearLegacyAuthStorage();
    }
  }
});

export const {
  clearCreateCompanyHighlight,
  logout,
  sessionAuthenticated,
  sessionMissing,
  sessionRestored,
  setCurrentUser
} = authSlice.actions;
export const authReducer = authSlice.reducer;
