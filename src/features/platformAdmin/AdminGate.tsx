import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { GlassCard } from "../../shared/components/GlassCard";
import {
  AdminPasskeyEnrollmentPage,
  AdminPasskeyVerificationPage,
  AdminSecurityBlockedPage
} from "./AdminPasskeyScreens";
import { useAdminSecurity } from "./adminSecurityContext";

export function AdminGate({ children }: { children: ReactNode }) {
  const { gate } = useAdminSecurity();

  if (gate === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <GlassCard className="max-w-sm p-6 text-center">
          <p className="text-sm font-bold text-ui-text-secondary">در حال بررسی امنیت مدیریت…</p>
        </GlassCard>
      </div>
    );
  }

  if (gate === "not_platform_admin") {
    return <Navigate replace to="/companies" />;
  }

  if (gate === "unsupported") {
    return <AdminSecurityBlockedPage kind="unsupported" />;
  }

  if (gate === "suspended") {
    return <AdminSecurityBlockedPage kind="suspended" />;
  }

  if (gate === "revoked") {
    return <AdminSecurityBlockedPage kind="revoked" />;
  }

  if (gate === "security_reset_required" || gate === "passkey_enrollment") {
    return (
      <AdminPasskeyEnrollmentPage
        mode={gate === "security_reset_required" ? "reset" : "initial"}
      />
    );
  }

  if (gate === "additional_root_passkey_required") {
    return <AdminPasskeyEnrollmentPage mode="root_second" />;
  }

  if (gate === "admin_passkey_verification") {
    return <AdminPasskeyVerificationPage />;
  }

  return children;
}
