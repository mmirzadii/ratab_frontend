import { useAppSelector } from "../../app/hooks";

import { hasAnyCapability, hasCapability, requireCapability } from "./platformAdminCapabilities";
import { useGetPlatformAdminMeQuery } from "./platformAdminApi";

/**
 * Capabilities/me for Admin dashboard modules.
 * Prefer AdminSecurityProvider gate for entry; this hook is presentation-only.
 */
export function usePlatformAdmin() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const skip = authStatus !== "authenticated";
  const query = useGetPlatformAdminMeQuery(undefined, { skip });

  const me = query.data;
  const capabilities = me?.capabilities ?? [];

  return {
    ...query,
    me,
    isPlatformAdmin: Boolean(me?.is_platform_admin),
    isSuperuser: Boolean(me?.is_superuser || me?.is_root_superuser),
    isRootSuperuser: Boolean(me?.is_root_superuser || me?.is_superuser),
    capabilities,
    baselineCapabilities: me?.baseline_capabilities ?? [],
    grantedCapabilities: me?.granted_capabilities ?? [],
    security: me?.security,
    can: (code: string) => hasCapability(capabilities, code),
    canAny: (codes: readonly string[]) => hasAnyCapability(capabilities, codes),
    requireCapability: (code: string) => requireCapability(capabilities, code)
  };
}

export { requireCapability, hasCapability };
