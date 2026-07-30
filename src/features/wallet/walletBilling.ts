import { formatDecimal } from "../../shared/utils/formatters";
import { normalizeNumberInput } from "../../shared/utils/numberText";
import type { components } from "../../shared/api/generated/schema";

export type TokenBillingError = components["schemas"]["TokenBillingError"];
export type CombinedTokenBillingError = components["schemas"]["CombinedTokenBillingError"];
export type CalculationBillingSummary = components["schemas"]["CalculationBillingSummary"];

function errorDataOf(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || !data) return null;
  return data as Record<string, unknown>;
}

function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || !error || !("status" in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

function codeOf(error: unknown): string | null {
  const data = errorDataOf(error);
  const code = data?.code;
  return typeof code === "string" ? code : null;
}

export function isInsufficientCombinedTokenBalance(
  error: unknown
): error is { status: 402; data: CombinedTokenBillingError } {
  return statusOf(error) === 402 && codeOf(error) === "INSUFFICIENT_COMBINED_TOKEN_BALANCE";
}

export function isInsufficientTokenBalance(
  error: unknown
): error is { status: 402; data: TokenBillingError } {
  return statusOf(error) === 402 && codeOf(error) === "INSUFFICIENT_TOKEN_BALANCE";
}

export function isIdempotencyKeyReused(
  error: unknown
): error is { status: 409; data: TokenBillingError } {
  return statusOf(error) === 409 && codeOf(error) === "IDEMPOTENCY_KEY_REUSED";
}

export function getCombinedInsufficientBalance(
  error: unknown
): CombinedTokenBillingError | null {
  if (!isInsufficientCombinedTokenBalance(error)) return null;
  return error.data;
}

export function formatInsufficientBalanceMessage(data: TokenBillingError): string {
  const required = data.required_tokens?.trim();
  const available = data.available_tokens?.trim();
  if (required && available) {
    return `موجودی توکن کافی نیست. موردنیاز: ${formatDecimal(required)} توکن، موجودی: ${formatDecimal(available)} توکن.`;
  }
  return "موجودی توکن کافی نیست.";
}

export function formatCalculationCostLabel(cost: string | null | undefined): string | null {
  if (cost === null || cost === undefined || String(cost).trim() === "") return null;
  return `هزینه محاسبه: ${formatDecimal(cost)} توکن`;
}

export function formatBillingBreakdown(billing: CalculationBillingSummary): string {
  const personal = Number(billing.personal_debit);
  const company = Number(billing.company_debit);
  const personalLabel = formatDecimal(billing.personal_debit);
  const companyLabel = formatDecimal(billing.company_debit);

  if (Number.isFinite(company) && company > 0 && Number.isFinite(personal) && personal > 0) {
    return `${personalLabel} توکن شخصی و ${companyLabel} توکن شرکت`;
  }
  if (Number.isFinite(company) && company > 0) {
    return `${companyLabel} توکن از کیف شرکت`;
  }
  return `${personalLabel} توکن از حساب شخصی`;
}

export function createIdempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createCalculationIdempotencyKey(): string {
  return createIdempotencyKey("calc");
}

export function createLineIdempotencyKey(): string {
  return createIdempotencyKey("line");
}

export function createDonationIdempotencyKey(): string {
  return createIdempotencyKey("donate");
}

export function isWholePositiveTokenAmount(value: string): boolean {
  const trimmed = normalizeNumberInput(value);
  if (!trimmed) return false;
  if (!/^[1-9]\d*$/.test(trimmed)) return false;
  return Number(trimmed) > 0;
}
