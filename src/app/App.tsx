import { RouterProvider } from "react-router-dom";

import { usePersistedTheme } from "../features/ui/usePersistedTheme";
import { useAppSelector } from "./hooks";
import { router } from "./router";

export function App() {
  const theme = useAppSelector((state) => state.ui.theme);
  usePersistedTheme(theme);

  return <RouterProvider router={router} />;
}
