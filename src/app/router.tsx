import { createBrowserRouter } from "react-router-dom";

import { HealthStatusPage } from "../features/health/HealthStatusPage";
import { AppShell } from "../shared/components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HealthStatusPage />
      }
    ]
  }
]);
