import type { PropsWithChildren, ReactNode } from "react";

import { hasAnyCapability, hasCapability } from "./platformAdminCapabilities";
import { usePlatformAdmin } from "./usePlatformAdmin";

type CanProps = PropsWithChildren<{
  capability?: string;
  anyOf?: readonly string[];
  /** Superuser-only UI (Admin management). */
  superuser?: boolean;
  fallback?: ReactNode;
}>;

/** UX-only capability gate. Backend 403 remains authoritative. */
export function Can({ capability, anyOf, superuser, fallback = null, children }: CanProps) {
  const { isPlatformAdmin, isSuperuser, capabilities, isLoading, isFetching } = usePlatformAdmin();

  if (isLoading || isFetching) return null;
  if (!isPlatformAdmin) return <>{fallback}</>;
  if (superuser && !isSuperuser) return <>{fallback}</>;
  if (capability && !hasCapability(capabilities, capability)) return <>{fallback}</>;
  if (anyOf && !hasAnyCapability(capabilities, anyOf)) return <>{fallback}</>;

  return <>{children}</>;
}
