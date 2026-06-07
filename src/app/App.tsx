import { RouterProvider } from "react-router-dom";

import { usePersistedUiState } from "../features/ui/usePersistedTheme";
import { useAppSelector } from "./hooks";
import { router } from "./router";

export function App() {
  const theme = useAppSelector((state) => state.ui.theme);
  const hasDismissedOnboarding = useAppSelector((state) => state.ui.hasDismissedOnboarding);
  usePersistedUiState(theme, hasDismissedOnboarding);

  return <RouterProvider router={router} />;
}
