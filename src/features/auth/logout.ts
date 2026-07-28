import type { AppDispatch } from "../../app/store";
import { baseApi } from "../../shared/api/baseApi";
import { authApi } from "./authApi";
import { logout } from "./authSlice";

/** Backend logout (CSRF-protected) then clear frontend auth/API state. */
export async function performLogout(dispatch: AppDispatch) {
  try {
    await dispatch(authApi.endpoints.logout.initiate()).unwrap();
  } catch {
    // Session may already be gone; still clear local auth UI state.
  }

  dispatch(logout());
  dispatch(baseApi.util.resetApiState());
}
