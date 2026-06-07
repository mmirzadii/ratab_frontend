import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "../features/auth/RequireAuth";
import { HealthStatusPage } from "../features/health/HealthStatusPage";
import { CompanyDashboardPage } from "../pages/CompanyDashboardPage";
import { CompanyListPage } from "../pages/CompanyListPage";
import { LoginPage } from "../pages/LoginPage";
import { AppShell } from "../shared/components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/status",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HealthStatusPage />
      }
    ]
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate replace to="/companies" />
      },
      {
        path: "companies",
        element: <CompanyListPage />
      },
      {
        path: "companies/:companyId",
        element: <CompanyDashboardPage />
      }
    ]
  }
]);
