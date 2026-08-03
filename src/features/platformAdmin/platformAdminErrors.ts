import { getApiErrorMessage } from "../../shared/utils/apiError";
import { AdminPasskeyApiError } from "./adminPasskeyClient";

const CODE_MESSAGES: Record<string, string> = {
  PLATFORM_ADMIN_REQUIRED: "دسترسی مدیریت پلتفرم لازم است.",
  ROOT_SUPERUSER_REQUIRED: "فقط مدیر ریشه می‌تواند این کار را انجام دهد.",
  PLATFORM_SUPERUSER_REQUIRED: "فقط مدیر ریشه می‌تواند این کار را انجام دهد.",
  PLATFORM_CAPABILITY_REQUIRED: "این بخش برای دسترسی‌های فعلی شما فعال نیست.",
  ADMIN_CAPABILITY_REQUIRED: "این بخش برای دسترسی‌های فعلی شما فعال نیست.",
  ADMIN_PASSKEY_ENROLLMENT_REQUIRED: "ثبت Passkey برای دسترسی مدیریت لازم است.",
  ADMIN_ADDITIONAL_ROOT_PASSKEY_REQUIRED: "ثبت Passkey پشتیبان برای حساب اصلی لازم است.",
  ADMIN_SESSION_REQUIRED: "نشست مدیریت قفل است. ابتدا با Passkey وارد شوید.",
  ADMIN_SESSION_EXPIRED: "نشست مدیریت منقضی شده است. دوباره با Passkey وارد شوید.",
  ADMIN_PASSKEY_STEP_UP_REQUIRED: "برای ادامه، تایید Passkey لازم است.",
  ADMIN_PASSKEY_ALREADY_REGISTERED: "این Passkey قبلا ثبت شده است.",
  ADMIN_PASSKEY_NOT_FOUND: "Passkey پیدا نشد.",
  ADMIN_PASSKEY_MINIMUM_REQUIRED: "تعداد Passkey فعال کمتر از حداقل مجاز است.",
  ADMIN_WEBAUTHN_NOT_CONFIGURED: "تنظیمات امنیتی دامنه یا مرورگر معتبر نیست.",
  ADMIN_WEBAUTHN_CHALLENGE_EXPIRED: "تایید Passkey منقضی شد. دوباره تلاش کنید.",
  ADMIN_WEBAUTHN_CHALLENGE_INVALID: "تایید Passkey انجام نشد. دوباره تلاش کنید.",
  ADMIN_WEBAUTHN_CHALLENGE_CONSUMED: "تایید Passkey انجام نشد. دوباره تلاش کنید.",
  ADMIN_WEBAUTHN_ORIGIN_INVALID: "تنظیمات امنیتی دامنه یا مرورگر معتبر نیست.",
  ADMIN_WEBAUTHN_RP_ID_INVALID: "تنظیمات امنیتی دامنه یا مرورگر معتبر نیست.",
  ADMIN_WEBAUTHN_VERIFICATION_FAILED: "تایید Passkey انجام نشد. دوباره تلاش کنید.",
  ADMIN_SECURITY_FLOW_RETIRED: "جریان امنیتی قبلی بازنشسته شده است. از Passkey استفاده کنید.",
  ADMIN_REASON_REQUIRED: "ثبت دلیل برای این عملیات الزامی است.",
  PLATFORM_ADMIN_REASON_REQUIRED: "ثبت دلیل برای این عملیات الزامی است.",
  PLATFORM_ADMIN_SUSPENDED: "عضویت مدیریتی شما تعلیق شده است.",
  PLATFORM_ADMIN_REVOKED: "عضویت مدیریتی شما لغو شده است.",
  PLATFORM_ADMIN_PHONE_EXACT_MATCH_REQUIRED: "شماره باید دقیق و کامل باشد.",
  PLATFORM_ADMIN_TARGET_NOT_FOUND: "کاربری با این شماره یافت نشد.",
  PLATFORM_ADMIN_TARGET_INACTIVE: "کاربر هدف فعال نیست.",
  PLATFORM_ADMIN_ALREADY_ACTIVE: "این کاربر از قبل مدیر فعال است.",
  PLATFORM_ADMIN_NOT_ACTIVE: "عضویت مدیریتی فعال نیست.",
  PLATFORM_ADMIN_CAPABILITY_UNKNOWN: "یکی از دسترسی‌های انتخاب‌شده نامعتبر است.",
  PLATFORM_ADMIN_BASELINE_CAPABILITY_IMMUTABLE: "دسترسی پایه تیکت قابل حذف نیست.",
  PLATFORM_SUPERUSER_SINGLETON_CONFLICT: "فقط یک مدیر ریشه مجاز است.",
  PLATFORM_SUPERUSER_TRANSFER_INVALID: "انتقال مدیر ریشه معتبر نیست.",
  SUPPORT_TICKET_ACCESS_DENIED: "دسترسی به این تیکت مجاز نیست.",
  SUPPORT_TICKET_CLOSED: "تیکت بسته است.",
  SUPPORT_INTERNAL_NOTE_FORBIDDEN: "یادداشت داخلی برای شما مجاز نیست.",
  FINANCIAL_ADJUSTMENT_SELF_APPROVAL_FORBIDDEN: "تأیید درخواست خودتان مجاز نیست.",
  PACKAGE_CODE_IMMUTABLE: "کد بسته پس از استفاده قابل تغییر نیست.",
  PLAN_CODE_IMMUTABLE: "کد پلن پس از استفاده قابل تغییر نیست.",
  PAYMENT_ORDER_STATUS_CONFLICT: "وضعیت سفارش اجازه این عملیات را نمی‌دهد."
};

const SESSION_ERROR_CODES = new Set([
  "ADMIN_SESSION_REQUIRED",
  "ADMIN_SESSION_EXPIRED"
]);

export function getErrorCode(error: unknown): string | null {
  if (error instanceof AdminPasskeyApiError) {
    return extractCode(error.data);
  }
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  return extractCode((error as { data?: unknown }).data);
}

function extractCode(data: unknown): string | null {
  if (typeof data !== "object" || !data || !("code" in data)) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isPasskeyStepUpRequiredError(error: unknown): boolean {
  return getErrorCode(error) === "ADMIN_PASSKEY_STEP_UP_REQUIRED";
}

export function isAdminSessionError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code != null && SESSION_ERROR_CODES.has(code);
}

/** @deprecated Legacy password step-up; use isPasskeyStepUpRequiredError. */
export function isStepUpRequiredError(error: unknown): boolean {
  return (
    isPasskeyStepUpRequiredError(error) ||
    getErrorCode(error) === "PLATFORM_ADMIN_STEP_UP_REQUIRED"
  );
}

export function formatPlatformAdminError(error: unknown, fallback?: string): string {
  const code = getErrorCode(error);
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  const status =
    error instanceof AdminPasskeyApiError
      ? error.status
      : typeof error === "object" && error && "status" in error
        ? (error as { status?: unknown }).status
        : null;
  if (status === 410) return CODE_MESSAGES.ADMIN_SECURITY_FLOW_RETIRED!;
  if (status === 429) return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
  if (status === 409) return getApiErrorMessage(error, "این عملیات با وضعیت فعلی در تضاد است.");
  return getApiErrorMessage(error, fallback);
}
