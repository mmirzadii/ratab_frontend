import { createBrowserRouter } from "react-router-dom";

import { HealthStatusPage } from "../features/health/HealthStatusPage";
import { DashboardPreviewPage } from "../pages/DashboardPreviewPage";
import { AppShell } from "../shared/components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPreviewPage />
      },
      {
        path: "status",
        element: <HealthStatusPage />
      }
    ]
  }
]);
