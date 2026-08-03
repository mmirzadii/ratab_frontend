import { createContext, useContext } from "react";

import type { AdminSecurityStatus } from "./adminSecurityTypes";
import type { PlatformAdminMe } from "./platformAdminTypes";

export type AdminGateView =
  | "loading"
  | "not_platform_admin"
  | "passkey_enrollment"
  | "additional_root_passkey_required"
  | "admin_passkey_verification"
  | "admin_dashboard"
  | "suspended"
  | "revoked"
  | "security_reset_required"
  | "unsupported";

export type AdminSecurityContextValue = {
  security: AdminSecurityStatus | null;
  me: PlatformAdminMe | undefined;
  gate: AdminGateView;
  sessionNotice: string | null;
  refetchSecurity: () => Promise<AdminSecurityStatus>;
  refetchMe: () => Promise<unknown>;
  clearAdminCaches: () => void;
  closeAdminSession: () => Promise<void>;
  runWithPasskeyStepUp: <T>(action: () => Promise<T>) => Promise<T>;
};

export const AdminSecurityContext = createContext<AdminSecurityContextValue | null>(null);

export function useAdminSecurity(): AdminSecurityContextValue {
  const ctx = useContext(AdminSecurityContext);
  if (!ctx) throw new Error("useAdminSecurity must be used within AdminSecurityProvider");
  return ctx;
}

/** Compatibility alias while pages migrate from useStepUp. */
export function useAdminPasskeyStepUp() {
  const { runWithPasskeyStepUp } = useAdminSecurity();
  return { runWithStepUp: runWithPasskeyStepUp, runWithPasskeyStepUp };
}
