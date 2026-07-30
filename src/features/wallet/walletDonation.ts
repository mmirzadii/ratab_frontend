import { formatDecimal } from "../../shared/utils/formatters";
import { normalizeNumberInput } from "../../shared/utils/numberText";
import type { TokenBillingError } from "./walletBilling";
import {
  formatInsufficientBalanceMessage,
  isIdempotencyKeyReused,
  isInsufficientTokenBalance,
  isWholePositiveTokenAmount
} from "./walletBilling";

export { isWholePositiveTokenAmount };

function errorDataOf(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || !data) return null;
  return data as Record<string, unknown>;
}

function statusOf(error: unknown): number | string | null {
  if (typeof error !== "object" || !error || !("status" in error)) return null;
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number" || typeof status === "string") return status;
  return null;
}

function codeOf(error: unknown): string | null {
  const data = errorDataOf(error);
  const code = data?.code;
  return typeof code === "string" ? code : null;
}

/** Normalize amount field input (Persian/Arabic digits → ASCII). Empty stays empty. */
export function normalizeDonationAmount(value: string): string {
  return normalizeNumberInput(value);
}

export function parseDonationAmount(value: string): number | null {
  if (!isWholePositiveTokenAmount(value)) return null;
  return Number(normalizeDonationAmount(value));
}

export type DonationFormValidation =
  | { ok: true; amount: string }
  | { ok: false; message: string };

export function validateDonationForm(input: {
  companyId: number | null;
  amount: string;
  personalBalance: string | null | undefined;
}): DonationFormValidation {
  if (input.companyId == null || !Number.isInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false, message: "شرکت را انتخاب کنید." };
  }

  const normalized = normalizeDonationAmount(input.amount);
  if (!normalized) {
    return { ok: false, message: "مقدار اهدا را وارد کنید." };
  }
  if (!isWholePositiveTokenAmount(normalized)) {
    return { ok: false, message: "مقدار باید یک عدد صحیح مثبت باشد." };
  }

  const personalBalance = Number(input.personalBalance ?? NaN);
  if (Number.isFinite(personalBalance) && Number(normalized) > personalBalance) {
    return { ok: false, message: "موجودی شخصی برای این اهدا کافی نیست." };
  }

  return { ok: true, amount: normalized };
}

export function isInsufficientPersonalTokenBalance(
  error: unknown
): error is { status: 402; data: TokenBillingError } {
  return statusOf(error) === 402 && codeOf(error) === "INSUFFICIENT_PERSONAL_TOKEN_BALANCE";
}

export function isCompanyMembershipRequired(error: unknown): boolean {
  return statusOf(error) === 403 && codeOf(error) === "COMPANY_MEMBERSHIP_REQUIRED";
}

export function isInvalidTokenAmount(error: unknown): boolean {
  return statusOf(error) === 400 && codeOf(error) === "INVALID_TOKEN_AMOUNT";
}

export function isDonationNetworkFailure(error: unknown): boolean {
  const status = statusOf(error);
  return status === "FETCH_ERROR" || status === "TIMEOUT_ERROR" || status === "PARSING_ERROR";
}

/**
 * Concise Persian donation errors — never surface raw English/HTML/JSON.
 */
export function formatDonationError(error: unknown): string {
  if (isInsufficientPersonalTokenBalance(error) || isInsufficientTokenBalance(error)) {
    const data = (error as { data: TokenBillingError }).data;
    return formatInsufficientBalanceMessage(data);
  }
  if (isCompanyMembershipRequired(error)) {
    return "عضویت فعال در این شرکت لازم است.";
  }
  if (isInvalidTokenAmount(error)) {
    return "مقدار باید یک عدد صحیح مثبت باشد.";
  }
  if (isIdempotencyKeyReused(error)) {
    return "این درخواست قبلاً با محتوای دیگری ثبت شده است. دوباره تلاش کنید.";
  }
  if (isDonationNetworkFailure(error)) {
    return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
  }
  if (statusOf(error) === 404 || statusOf(error) === 503) {
    return "کیف توکن شرکت در دسترس نیست.";
  }
  return "اهدا ناموفق بود. دوباره تلاش کنید.";
}

export function formatCompanyTokenBadgeLabel(balance: string | null | undefined): string {
  if (balance == null || String(balance).trim() === "") return "شرکت: —";
  return `شرکت: ${formatDecimal(balance)} توکن`;
}

export const DONATION_SUCCESS_TOAST = "توکن‌ها با موفقیت به کیف شرکت منتقل شدند.";
export const DONATION_TRANSFER_NOTICE =
  "توکن‌های اهداشده به کیف شرکت منتقل می‌شوند و از موجودی شخصی شما کسر خواهند شد.";
