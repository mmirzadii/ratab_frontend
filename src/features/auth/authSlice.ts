import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AppUser, DevLoginResponse } from "./authApi";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "./tokenStorage";

type AuthState = {
  token: string | null;
  user: AppUser | null;
  shouldHighlightCreateCompany: boolean;
};

const initialState: AuthState = {
  token: getStoredAuthToken(),
  user: null,
  shouldHighlightCreateCompany: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setDevLoginSession(state, action: PayloadAction<DevLoginResponse>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.shouldHighlightCreateCompany = action.payload.created;
      setStoredAuthToken(action.payload.token);
    },
    setCurrentUser(state, action: PayloadAction<AppUser>) {
      state.user = action.payload;
    },
    clearCreateCompanyHighlight(state) {
      state.shouldHighlightCreateCompany = false;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.shouldHighlightCreateCompany = false;
      clearStoredAuthToken();
    }
  }
});

export const {
  clearCreateCompanyHighlight,
  logout,
  setCurrentUser,
  setDevLoginSession
} = authSlice.actions;
export const authReducer = authSlice.reducer;
