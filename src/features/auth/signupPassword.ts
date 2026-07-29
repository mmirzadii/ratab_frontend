/** Blocking client validation: backend also requires a minimum length of 6. */
export const SIGNUP_PASSWORD_MIN_LENGTH = 6;

export const SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE = "رمز عبور باید حداقل ۶ کاراکتر باشد.";

export const SIGNUP_PASSWORD_WEAK_WARNING =
  "رمز عبور ساده است؛ بهتر است از حداقل ۸ کاراکتر و ترکیب حروف و عدد استفاده کنید.";

export const SIGNUP_TICKET_INVALID_MESSAGE =
  "بلیط ثبت‌نام منقضی یا نامعتبر است. از ابتدا شروع کنید.";

/** Local UX-only patterns. Never sent to the backend as a strength score. */
const OBVIOUS_WEAK_PATTERNS = new Set([
  "123456",
  "654321",
  "abcdef",
  "qwerty",
  "password",
  "111111"
]);

function looksLikeHtmlPayload(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim().slice(0, 200).toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("<body") ||
    trimmed.includes("csrf verification failed") ||
    trimmed.includes("origin checking failed")
  );
}

export function meetsSignupPasswordMinLength(password: string): boolean {
  return password.length >= SIGNUP_PASSWORD_MIN_LENGTH;
}

export function isSignupPasswordWeak(password: string): boolean {
  if (password.length < SIGNUP_PASSWORD_MIN_LENGTH) {
    return false;
  }

  if (password.length < 8) {
    return true;
  }

  if (/^\d+$/.test(password)) {
    return true;
  }

  if (/^[A-Za-z]+$/.test(password)) {
    return true;
  }

  if (password.length > 0 && [...password].every((ch) => ch === password[0])) {
    return true;
  }

  if (OBVIOUS_WEAK_PATTERNS.has(password.toLowerCase())) {
    return true;
  }

  return false;
}

function firstStringMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim() && !looksLikeHtmlPayload(value)) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim() && !looksLikeHtmlPayload(item)) {
        return item.trim();
      }
    }
  }
  return null;
}

function errorDataOf(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || !error || !("data" in error)) {
    return null;
  }
  const data = (error as { data?: unknown }).data;
  if (looksLikeHtmlPayload(data)) {
    return null;
  }
  if (typeof data !== "object" || !data) {
    return null;
  }
  return data as Record<string, unknown>;
}

function looksLikeTicketMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("ticket") ||
    lower.includes("signup_ticket") ||
    text.includes("بلیط") ||
    (lower.includes("expired") && lower.includes("signup")) ||
    (lower.includes("invalid") && lower.includes("ticket"))
  );
}

function looksLikeShortPasswordMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes("password") && (lower.includes("short") || lower.includes("at least 6") || lower.includes("minimum 6"))) ||
    (lower.includes("6") && (lower.includes("character") || lower.includes("کاراکتر"))) ||
    text.includes("حداقل ۶") ||
    text.includes("حداقل 6")
  );
}

export type SignupCompleteErrorKind = "password" | "password_confirmation" | "ticket" | "form";

export type SignupCompleteErrorClassification = {
  kind: SignupCompleteErrorKind;
  message: string;
};

/**
 * Classify signup-complete 400/other failures by field/code instead of treating every 400 as an invalid ticket.
 */
export function classifySignupCompleteError(
  error: unknown,
  fallback = "تکمیل ثبت‌نام ناموفق بود."
): SignupCompleteErrorClassification {
  const data = errorDataOf(error);

  if (data) {
    const passwordMessage = firstStringMessage(data.password);
    if (passwordMessage) {
      return {
        kind: "password",
        message: looksLikeShortPasswordMessage(passwordMessage)
          ? SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE
          : passwordMessage
      };
    }

    const confirmMessage = firstStringMessage(data.password_confirmation);
    if (confirmMessage) {
      return { kind: "password_confirmation", message: confirmMessage };
    }

    const ticketMessage = firstStringMessage(data.signup_ticket);
    if (ticketMessage) {
      return { kind: "ticket", message: SIGNUP_TICKET_INVALID_MESSAGE };
    }

    const code = typeof data.code === "string" ? data.code.toLowerCase() : "";
    if (
      code.includes("ticket") ||
      code === "signup_ticket_invalid" ||
      code === "invalid_signup_ticket" ||
      code === "signup_ticket_expired"
    ) {
      return { kind: "ticket", message: SIGNUP_TICKET_INVALID_MESSAGE };
    }

    const detail = firstStringMessage(data.detail);
    if (detail) {
      if (looksLikeTicketMessage(detail)) {
        return { kind: "ticket", message: SIGNUP_TICKET_INVALID_MESSAGE };
      }
      if (looksLikeShortPasswordMessage(detail)) {
        return { kind: "password", message: SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE };
      }
      return { kind: "form", message: detail };
    }
  }

  if (looksLikeHtmlPayload((error as { data?: unknown } | null)?.data)) {
    return { kind: "form", message: fallback };
  }

  return { kind: "form", message: fallback };
}

export function canSubmitSignupPassword(password: string, passwordConfirmation: string): boolean {
  return (
    meetsSignupPasswordMinLength(password) &&
    passwordConfirmation.length > 0 &&
    password === passwordConfirmation
  );
}
