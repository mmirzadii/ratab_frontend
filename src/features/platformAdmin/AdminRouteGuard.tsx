import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { GlassCard } from "../../shared/components/GlassCard";
import { hasAnyCapability, hasCapability } from "./platformAdminCapabilities";
import { usePlatformAdmin } from "./usePlatformAdmin";

type Props = PropsWithChildren<{
  /** Optional capability required for this route (UX only). */
  capability?: string;
  anyOf?: readonly string[];
  /** Root Superuser only. */
  superuser?: boolean;
  /** When true, only checks identity (used by nested page guards). */
  nest?: boolean;
}>;

export function AdminRouteGuard({ children, capability, anyOf, superuser, nest = false }: Props) {
  const location = useLocation();
  const { isPlatformAdmin, isSuperuser, capabilities, isLoading, isFetching, isError, error } =
    usePlatformAdmin();

  if (isLoading || (!nest && isFetching && !isPlatformAdmin)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <GlassCard className="max-w-sm p-6 text-center">
          <p className="text-sm font-bold text-ui-text-secondary">در حال بررسی دسترسی مدیریت…</p>
        </GlassCard>
      </div>
    );
  }

  if (!nest && (isError || !isPlatformAdmin)) {
    const status =
      typeof error === "object" && error && "status" in error
        ? (error as { status?: unknown }).status
        : null;
    if (status === 401) {
      return <Navigate replace state={{ from: location }} to="/login" />;
    }
    return <Navigate replace to="/companies" />;
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
