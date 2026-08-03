import { apiBaseUrl } from "../../shared/api/baseApi";
import { getCsrfHeaderToken, setCsrfTokenFromApi } from "../auth/csrf";
import type {
  SerializedPublicKeyCredential,
  ServerPublicKeyCredentialCreationOptions,
  ServerPublicKeyCredentialRequestOptions
} from "./webauthnBase64url";
import {
  normalizeAdminSecurityStatus,
  normalizeSafePasskey,
  type AdminSecurityStatus,
  type SafePasskey
} from "./adminSecurityTypes";

export class AdminPasskeyApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "AdminPasskeyApiError";
    this.status = status;
    this.data = data;
  }
}

async function ensureCsrf(): Promise<void> {
  if (getCsrfHeaderToken()) return;
  const response = await fetch(`${apiBaseUrl}/api/auth/csrf/`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) return;
  try {
    const data = (await response.json()) as { csrf_token?: string };
    if (typeof data.csrf_token === "string") setCsrfTokenFromApi(data.csrf_token);
  } catch {
    // ignore
  }
}

async function requestJson<T>(
  path: string,
  init?: { method?: string; body?: Record<string, unknown> | null }
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") await ensureCsrf();
  const headers: Record<string, string> = { Accept: "application/json" };
  const csrf = getCsrfHeaderToken();
  if (csrf && method !== "GET" && method !== "HEAD") headers["X-CSRFToken"] = csrf;
  if (init?.body != null) headers["Content-Type"] = "application/json";

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: "include",
    headers,
    body: init?.body != null ? JSON.stringify(init.body) : undefined
  });

  let data: unknown = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new AdminPasskeyApiError("Admin Passkey request failed", response.status, data);
  }
  return data as T;
}

/**
 * Ceremony endpoints intentionally use fetch (not RTK Query) so challenges and
 * credential responses never enter Redux / persisted query caches.
 */
export async function fetchAdminSecurityStatus(): Promise<AdminSecurityStatus> {
  const raw = await requestJson<unknown>("/api/platform-admin/security/status/");
  return normalizeAdminSecurityStatus(raw);
}

export async function enrollmentReauthenticate(password: string): Promise<void> {
  await requestJson("/api/platform-admin/passkeys/enrollment/reauthenticate/", {
    method: "POST",
    body: { password }
  });
}

export async function fetchRegistrationOptions(): Promise<ServerPublicKeyCredentialCreationOptions> {
  const raw = await requestJson<{ publicKey?: ServerPublicKeyCredentialCreationOptions }>(
    "/api/platform-admin/passkeys/registration/options/",
    { method: "POST", body: {} }
  );
  if (!raw?.publicKey) throw new AdminPasskeyApiError("Missing publicKey", 500, raw);
  return raw.publicKey;
}

export async function verifyRegistration(input: {
  credential: SerializedPublicKeyCredential;
  label?: string;
}): Promise<{
  passkey_id: number;
  passkey_count: number;
  required_passkey_count: number;
  enrollment_complete: boolean;
}> {
  return requestJson("/api/platform-admin/passkeys/registration/verify/", {
    method: "POST",
    body: {
      credential: input.credential,
      ...(input.label ? { label: input.label } : {})
    }
  });
}

export async function fetchSessionAuthOptions(): Promise<ServerPublicKeyCredentialRequestOptions> {
  const raw = await requestJson<{ publicKey?: ServerPublicKeyCredentialRequestOptions }>(
    "/api/platform-admin/session/webauthn/options/",
    { method: "POST", body: {} }
  );
  if (!raw?.publicKey) throw new AdminPasskeyApiError("Missing publicKey", 500, raw);
  return raw.publicKey;
}

export async function verifySessionAuth(credential: SerializedPublicKeyCredential): Promise<{
  admin_session_active: boolean;
  admin_session_expires_at: string | null;
  step_up_fresh: boolean;
}> {
  return requestJson("/api/platform-admin/session/webauthn/verify/", {
    method: "POST",
    body: { credential }
  });
}

export async function fetchStepUpOptions(): Promise<ServerPublicKeyCredentialRequestOptions> {
  const raw = await requestJson<{ publicKey?: ServerPublicKeyCredentialRequestOptions }>(
    "/api/platform-admin/step-up/webauthn/options/",
    { method: "POST", body: {} }
  );
  if (!raw?.publicKey) throw new AdminPasskeyApiError("Missing publicKey", 500, raw);
  return raw.publicKey;
}

export async function verifyStepUp(credential: SerializedPublicKeyCredential): Promise<{
  step_up_fresh: boolean;
  last_strong_verification_at?: string | null;
}> {
  return requestJson("/api/platform-admin/step-up/webauthn/verify/", {
    method: "POST",
    body: { credential }
  });
}

export async function closeAdminSession(): Promise<void> {
  await requestJson("/api/platform-admin/session/", { method: "DELETE", body: null });
}

export async function listPasskeys(): Promise<SafePasskey[]> {
  const raw = await requestJson<{ results?: unknown[] }>("/api/platform-admin/passkeys/");
  return (raw.results ?? []).map(normalizeSafePasskey);
}

export async function renamePasskey(passkeyId: number, label: string): Promise<void> {
  await requestJson(`/api/platform-admin/passkeys/${passkeyId}/`, {
    method: "PATCH",
    body: { label }
  });
}

export async function deletePasskey(passkeyId: number, reason: string): Promise<void> {
  await requestJson(`/api/platform-admin/passkeys/${passkeyId}/`, {
    method: "DELETE",
    body: { reason }
  });
}

export async function resetAdminPasskeys(membershipId: number, reason: string): Promise<void> {
  await requestJson(`/api/platform-admin/superuser/admins/${membershipId}/reset-passkeys/`, {
    method: "POST",
    body: { reason }
  });
}
