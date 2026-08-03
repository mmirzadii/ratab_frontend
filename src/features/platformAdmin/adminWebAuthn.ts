import {
  creationOptionsFromServer,
  requestOptionsFromServer,
  serializeAuthenticationCredential,
  serializeRegistrationCredential,
  type SerializedPublicKeyCredential,
  type ServerPublicKeyCredentialCreationOptions,
  type ServerPublicKeyCredentialRequestOptions
} from "./webauthnBase64url";

export const WEBAUTHN_UNSUPPORTED_MESSAGE =
  "این مرورگر یا محیط از ورود امن پنل مدیریت پشتیبانی نمی‌کند. مرورگر را به‌روزرسانی کنید یا از یک دستگاه سازگار استفاده کنید.";

export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext && window.location.hostname !== "localhost") return false;
  return Boolean(window.PublicKeyCredential && navigator.credentials);
}

export type WebAuthnUiErrorCode =
  | "cancelled"
  | "no_credential"
  | "duplicate"
  | "security_config"
  | "unsupported"
  | "generic";

export function classifyWebAuthnDomError(error: unknown): WebAuthnUiErrorCode {
  if (!error || typeof error !== "object") return "generic";
  const name = "name" in error ? String((error as { name?: unknown }).name || "") : "";
  if (name === "NotAllowedError" || name === "AbortError") return "cancelled";
  if (name === "InvalidStateError") return "duplicate";
  if (name === "SecurityError" || name === "NotSupportedError") return "security_config";
  if (name === "NetworkError") return "generic";
  return "generic";
}

export function webAuthnUiMessage(code: WebAuthnUiErrorCode): string {
  switch (code) {
    case "unsupported":
      return WEBAUTHN_UNSUPPORTED_MESSAGE;
    case "cancelled":
      return "تایید Passkey انجام نشد. دوباره تلاش کنید.";
    case "no_credential":
      return "Passkey سازگار برای این حساب پیدا نشد.";
    case "duplicate":
      return "این Passkey قبلا ثبت شده است.";
    case "security_config":
      return "تنظیمات امنیتی دامنه یا مرورگر معتبر نیست.";
    default:
      return "تایید Passkey انجام نشد. دوباره تلاش کنید.";
  }
}

export async function createPasskeyCredential(
  serverOptions: ServerPublicKeyCredentialCreationOptions
): Promise<SerializedPublicKeyCredential> {
  if (!isWebAuthnSupported()) {
    const err = new Error(WEBAUTHN_UNSUPPORTED_MESSAGE);
    err.name = "NotSupportedError";
    throw err;
  }
  const publicKey = creationOptionsFromServer(serverOptions);
  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) {
    const err = new Error("No credential");
    err.name = "NotAllowedError";
    throw err;
  }
  return serializeRegistrationCredential(credential);
}

export async function getPasskeyAssertion(
  serverOptions: ServerPublicKeyCredentialRequestOptions
): Promise<SerializedPublicKeyCredential> {
  if (!isWebAuthnSupported()) {
    const err = new Error(WEBAUTHN_UNSUPPORTED_MESSAGE);
    err.name = "NotSupportedError";
    throw err;
  }
  const publicKey = requestOptionsFromServer(serverOptions);
  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!credential) {
    const err = new Error("No credential");
    err.name = "NotAllowedError";
    throw err;
  }
  return serializeAuthenticationCredential(credential);
}
