import { looksLikeHtmlPayload } from "../../features/auth/csrf";

const DEFAULT_FALLBACK = "در ارتباط با سرور خطایی رخ داد. لطفاً دوباره تلاش کنید.";
const CSRF_ORIGIN_FALLBACK =
  "درخواست به دلیل تنظیمات امنیتی CSRF رد شد. مبدأ فرانت‌اند باید در CSRF_TRUSTED_ORIGINS بک‌اند باشد.";
const FORBIDDEN_FALLBACK = "دسترسی مجاز نیست. لطفاً دوباره وارد شوید یا با مدیر سیستم تماس بگیرید.";

function statusOf(error: unknown): number | null {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : null;
  }
  return null;
}

function messageFromJsonData(data: object): string | null {
  if ("detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim() && !looksLikeHtmlPayload(detail)) {
      return detail.trim();
    }
  }

  if ("code" in data) {
    const code = (data as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) {
      // Prefer explicit detail when present; otherwise keep structured code for callers.
      const detail = "detail" in data ? (data as { detail?: unknown }).detail : null;
      if (typeof detail === "string" && detail.trim() && !looksLikeHtmlPayload(detail)) {
        return detail.trim();
      }
    }
  }

  const fieldMessages: string[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (key === "detail" || key === "code") continue;
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      fieldMessages.push(...(value as string[]));
    } else if (typeof value === "string" && !looksLikeHtmlPayload(value)) {
      fieldMessages.push(value);
    }
  }
  if (fieldMessages.length > 0) {
    return fieldMessages.join(" ");
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback = DEFAULT_FALLBACK): string {
  const status = statusOf(error);

  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (looksLikeHtmlPayload(data)) {
      const html = typeof data === "string" ? data.toLowerCase() : "";
      if (html.includes("origin checking failed") || html.includes("csrf")) {
        return CSRF_ORIGIN_FALLBACK;
      }
      if (status === 403) {
        return FORBIDDEN_FALLBACK;
      }
      return fallback;
    }

    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    if (typeof data === "object" && data) {
      const fromJson = messageFromJsonData(data);
      if (fromJson) {
        return fromJson;
      }
    }
  }

  if (status === 403) {
    return FORBIDDEN_FALLBACK;
  }

  return fallback;
}
