import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "../features/auth/RequireAuth";
import { HealthStatusPage } from "../features/health/HealthStatusPage";
import { CompanyDashboardPage } from "../pages/CompanyDashboardPage";
import { CompanyListPage } from "../pages/CompanyListPage";
import { CostReportWizardPage } from "../pages/CostReportWizardPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { AppShell } from "../shared/components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
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
        path: "dashboard",
        element: <Navigate replace to="/companies" />
      },
      {
        path: "companies",
        element: <CompanyListPage />
      },
      {
        path: "companies/:companyId",
        element: <CompanyDashboardPage />
      },
      {
        path: "companies/:companyId/cost-reports/new",
        element: <CostReportWizardPage />
      }
    ]
  }
]);
