import { getApiErrorMessage } from "../../shared/utils/apiError";

const CODE_MESSAGES: Record<string, string> = {
  PLATFORM_ADMIN_REQUIRED: "دسترسی مدیریت پلتفرم لازم است.",
  PLATFORM_SUPERUSER_REQUIRED: "فقط مدیر ریشه می‌تواند این کار را انجام دهد.",
  PLATFORM_CAPABILITY_REQUIRED: "این بخش برای دسترسی‌های فعلی شما فعال نیست.",
  PLATFORM_ADMIN_STEP_UP_REQUIRED: "برای ادامه، تأیید رمز عبور لازم است.",
  PLATFORM_ADMIN_STEP_UP_FAILED: "رمز عبور تأیید نشد.",
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

export function getErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || !data || !("code" in data)) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isStepUpRequiredError(error: unknown): boolean {
  return getErrorCode(error) === "PLATFORM_ADMIN_STEP_UP_REQUIRED";
}

export function formatPlatformAdminError(error: unknown, fallback?: string): string {
  const code = getErrorCode(error);
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  const status =
    typeof error === "object" && error && "status" in error
      ? (error as { status?: unknown }).status
      : null;
  if (status === 429) return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
  if (status === 409) return getApiErrorMessage(error, "این عملیات با وضعیت فعلی در تضاد است.");
  return getApiErrorMessage(error, fallback);
}
