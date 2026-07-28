import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "../features/auth/RequireAuth";
import { HealthStatusPage } from "../features/health/HealthStatusPage";
import { AccountSettingsPage } from "../pages/AccountSettingsPage";
import { CompanyCreatePage } from "../pages/CompanyCreatePage";
import { CompanyDashboardPage } from "../pages/CompanyDashboardPage";
import { CompanyListPage } from "../pages/CompanyListPage";
import { CostReportWizardPage } from "../pages/CostReportWizardPage";
import { HelpPage } from "../pages/HelpPage";
import { LoginPage } from "../pages/LoginPage";
import { RootPage } from "../pages/RootPage";
import { SignupPage } from "../pages/SignupPage";
import { AppShell } from "../shared/components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/signup",
    element: <SignupPage />
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
        path: "companies/new",
        element: <CompanyCreatePage />
      },
      {
        path: "companies/:companyId",
        element: <CompanyDashboardPage />
      },
      {
        path: "companies/:companyId/cost-reports/new",
        element: <CostReportWizardPage />
      },
      {
        path: "help",
        element: <HelpPage />
      },
      {
        path: "settings",
        element: <AccountSettingsPage />
      }
    ]
  }
]);
