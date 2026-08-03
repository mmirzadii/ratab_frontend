export type AdminNextStep =
  | "not_platform_admin"
  | "membership_pending"
  | "passkey_enrollment"
  | "additional_root_passkey_required"
  | "admin_passkey_verification"
  | "admin_dashboard"
  | "suspended"
  | "revoked"
  | "security_reset_required";

export type AdminSecurityStatus = {
  is_platform_admin: boolean;
  is_root_superuser: boolean;
  membership_status: string | null;
  passkey_count: number;
  required_passkey_count: number;
  passkey_enrollment_required: boolean;
  admin_session_active: boolean;
  admin_session_expires_at: string | null;
  step_up_fresh: boolean;
  next_step: AdminNextStep;
};

export type SafePasskey = {
  id: number;
  label: string;
  authenticator_attachment: string;
  transports: string[];
  backup_eligible: boolean | null;
  backup_state: boolean | null;
  created_at: string | null;
  last_used_at: string | null;
};

export function normalizeAdminSecurityStatus(raw: unknown): AdminSecurityStatus {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const next = String(data.next_step || "not_platform_admin") as AdminNextStep;
  return {
    is_platform_admin: Boolean(data.is_platform_admin),
    is_root_superuser: Boolean(data.is_root_superuser),
    membership_status: typeof data.membership_status === "string" ? data.membership_status : null,
    passkey_count: Number(data.passkey_count || 0),
    required_passkey_count: Number(data.required_passkey_count || 0),
    passkey_enrollment_required: Boolean(data.passkey_enrollment_required),
    admin_session_active: Boolean(data.admin_session_active),
    admin_session_expires_at:
      typeof data.admin_session_expires_at === "string" ? data.admin_session_expires_at : null,
    step_up_fresh: Boolean(data.step_up_fresh),
    next_step: next
  };
}

export function normalizeSafePasskey(raw: unknown): SafePasskey {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: Number(data.id || 0),
    label: typeof data.label === "string" ? data.label : "Passkey",
    authenticator_attachment:
      typeof data.authenticator_attachment === "string" ? data.authenticator_attachment : "",
    transports: Array.isArray(data.transports)
      ? data.transports.filter((item): item is string => typeof item === "string")
      : [],
    backup_eligible: typeof data.backup_eligible === "boolean" ? data.backup_eligible : null,
    backup_state: typeof data.backup_state === "boolean" ? data.backup_state : null,
    created_at: typeof data.created_at === "string" ? data.created_at : null,
    last_used_at: typeof data.last_used_at === "string" ? data.last_used_at : null
  };
}

/** Known obsolete MFA/TOTP/action-proof client keys — remove without reading values. */
export const OBSOLETE_ADMIN_SECURITY_STORAGE_KEYS = [
  "ratab.admin.mfa",
  "ratab.admin.totp",
  "ratab.admin.otpauth",
  "ratab.admin.recovery",
  "ratab.admin.actionPassword",
  "ratab.admin.actionProof",
  "ratab.admin.unlock",
  "metril.admin.mfa",
  "metril.admin.totp"
] as const;

export function clearObsoleteAdminSecurityStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of OBSOLETE_ADMIN_SECURITY_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
