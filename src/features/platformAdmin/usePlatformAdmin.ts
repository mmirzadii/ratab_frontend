import { useAppSelector } from "../../app/hooks";

import { hasAnyCapability, hasCapability, requireCapability } from "./platformAdminCapabilities";
import { useGetPlatformAdminMeQuery } from "./platformAdminApi";

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
    isSuperuser: Boolean(me?.is_superuser),
    capabilities,
    baselineCapabilities: me?.baseline_capabilities ?? [],
    grantedCapabilities: me?.granted_capabilities ?? [],
    stepUp: me?.step_up ?? { verified: false, expires_at: null },
    can: (code: string) => hasCapability(capabilities, code),
    canAny: (codes: readonly string[]) => hasAnyCapability(capabilities, codes),
    requireCapability: (code: string) => requireCapability(capabilities, code)
  };
}

export { requireCapability, hasCapability };
