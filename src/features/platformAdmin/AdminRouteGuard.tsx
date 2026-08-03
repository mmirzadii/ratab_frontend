import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { hasAnyCapability, hasCapability } from "./platformAdminCapabilities";
import { useAdminSecurity } from "./adminSecurityContext";
import { usePlatformAdmin } from "./usePlatformAdmin";

type Props = PropsWithChildren<{
  /** Optional capability required for this route (UX only). */
  capability?: string;
  anyOf?: readonly string[];
  /** Root Superuser only. */
  superuser?: boolean;
}>;

/** Nested capability/superuser gate. Entry identity is handled by AdminGate. */
export function AdminRouteGuard({ children, capability, anyOf, superuser }: Props) {
  const { gate } = useAdminSecurity();
  const { isSuperuser, capabilities } = usePlatformAdmin();

  if (gate !== "admin_dashboard") {
    return null;
  }

  if (superuser && !isSuperuser) {
    return <Navigate replace to="/admin" />;
  }

  if (!isSuperuser) {
    if (capability && !hasCapability(capabilities, capability)) {
      return <Navigate replace to="/admin" />;
    }
    if (anyOf && !hasAnyCapability(capabilities, anyOf)) {
      return <Navigate replace to="/admin" />;
    }
  }

  return children;
}
