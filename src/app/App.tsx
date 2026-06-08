import { RouterProvider } from "react-router-dom";

import { usePersistedUiState } from "../features/ui/usePersistedTheme";
import { useAppSelector } from "./hooks";
import { router } from "./router";

export function App() {
  const theme = useAppSelector((state) => state.ui.theme);
  const hasDismissedOnboarding = useAppSelector((state) => state.ui.hasDismissedOnboarding);
  const user = useAppSelector((state) => state.auth.user);
  const onboardingUserKey = user
    ? `user-${user.id ?? user.phone_number}`
    : "anonymous";
  usePersistedUiState(theme, hasDismissedOnboarding, onboardingUserKey);

  return <RouterProvider router={router} />;
}
