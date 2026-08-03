import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "../features/auth/RequireAuth";
import { CreateCompanyGroupPanel } from "../features/companies/CreateCompanyGroupPanel";
import { HealthStatusPage } from "../features/health/HealthStatusPage";
import { AdminRouteGuard } from "../features/platformAdmin/AdminRouteGuard";
import { AdminShell } from "../features/platformAdmin/AdminShell";
import { AdminGate } from "../features/platformAdmin/AdminGate";
import { AdminSecurityProvider } from "../features/platformAdmin/AdminSecurityProvider";
import { AdminAdminDetailPage } from "../features/platformAdmin/pages/AdminAdminDetailPage";
import { AdminAdminsPage } from "../features/platformAdmin/pages/AdminAdminsPage";
import { AdminAdjustmentsPage } from "../features/platformAdmin/pages/AdminAdjustmentsPage";
import { AdminAuditPage } from "../features/platformAdmin/pages/AdminAuditPage";
import { AdminCompaniesPage } from "../features/platformAdmin/pages/AdminCompaniesPage";
import { AdminDashboardPage } from "../features/platformAdmin/pages/AdminDashboardPage";
import { AdminOperationsPage } from "../features/platformAdmin/pages/AdminOperationsPage";
import { AdminOrdersPage } from "../features/platformAdmin/pages/AdminOrdersPage";
import { AdminPackagesPage } from "../features/platformAdmin/pages/AdminPackagesPage";
import { AdminPlansPage } from "../features/platformAdmin/pages/AdminPlansPage";
import { AdminSecurityPage } from "../features/platformAdmin/pages/AdminSecurityPage";
import { AdminSubscriptionsPage } from "../features/platformAdmin/pages/AdminSubscriptionsPage";
import { AdminTicketDetailPage } from "../features/platformAdmin/pages/AdminTicketDetailPage";
import { AdminTicketsPage } from "../features/platformAdmin/pages/AdminTicketsPage";
import { AdminUsersPage } from "../features/platformAdmin/pages/AdminUsersPage";
import { SupportTicketDetailPage } from "../features/support/SupportTicketDetailPage";
import { SupportTicketsPage } from "../features/support/SupportTicketsPage";
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
        element: <CompanyDashboardPage />,
        children: [
          {
            path: "groups/new",
            element: <CreateCompanyGroupPanel />
          }
        ]
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
      },
      {
        path: "support/tickets",
        element: <SupportTicketsPage />
      },
      {
        path: "support/tickets/:ticketId",
        element: <SupportTicketDetailPage />
      },
      {
        path: "admin",
        element: (
          <AdminSecurityProvider>
            <AdminGate>
              <AdminShell />
            </AdminGate>
          </AdminSecurityProvider>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "security", element: <AdminSecurityPage /> },
          { path: "support/tickets", element: <AdminTicketsPage /> },
          { path: "support/tickets/:ticketId", element: <AdminTicketDetailPage /> },
          {
            path: "users",
            element: (
              <AdminRouteGuard capability="admin.users.view">
                <AdminUsersPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "companies",
            element: (
              <AdminRouteGuard capability="admin.companies.view">
                <AdminCompaniesPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "commerce/packages",
            element: (
              <AdminRouteGuard capability="admin.packages.view">
                <AdminPackagesPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "commerce/plans",
            element: (
              <AdminRouteGuard capability="admin.plans.view">
                <AdminPlansPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "commerce/orders",
            element: (
              <AdminRouteGuard capability="admin.orders.view">
                <AdminOrdersPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "commerce/adjustments",
            element: (
              <AdminRouteGuard
                anyOf={[
                  "admin.wallets.adjust.request",
                  "admin.wallets.adjust.approve",
                  "admin.wallets.view"
                ]}
              >
                <AdminAdjustmentsPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "subscriptions",
            element: (
              <AdminRouteGuard capability="admin.subscriptions.view">
                <AdminSubscriptionsPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "audit",
            element: (
              <AdminRouteGuard capability="admin.audit.view">
                <AdminAuditPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "operations",
            element: (
              <AdminRouteGuard capability="admin.operations.view">
                <AdminOperationsPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "admins",
            element: (
              <AdminRouteGuard superuser>
                <AdminAdminsPage />
              </AdminRouteGuard>
            )
          },
          {
            path: "admins/:membershipId",
            element: (
              <AdminRouteGuard superuser>
                <AdminAdminDetailPage />
              </AdminRouteGuard>
            )
          },
          // Legacy TOTP / MFA paths redirect safely into AdminGate.
          { path: "mfa/*", element: <Navigate replace to="/admin" /> },
          { path: "enroll/*", element: <Navigate replace to="/admin" /> },
          { path: "unlock", element: <Navigate replace to="/admin" /> }
        ]
      }
    ]
  }
]);
