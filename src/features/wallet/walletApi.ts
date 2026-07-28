import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type TokenWallet = components["schemas"]["TokenWallet"];
export type TokenWalletTransaction = components["schemas"]["TokenWalletTransaction"];
export type PaginatedTokenWalletTransaction =
  components["schemas"]["PaginatedTokenWalletTransaction"];
export type TransactionTypeEnum = components["schemas"]["TransactionTypeEnum"];
export type TokenBillingError = components["schemas"]["TokenBillingError"];

/** UI copy only. The backend is the sole authority for the actual charge. */
export const OFFICIAL_LINE_TOKEN_COST = 5;

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTokenWallet: builder.query<TokenWallet, void>({
      query: () => "/api/token-wallet/",
      providesTags: [{ type: "Wallet", id: "BALANCE" }]
    }),
    listTokenWalletTransactions: builder.query<PaginatedTokenWalletTransaction, void>({
      query: () => "/api/token-wallet/transactions/",
      providesTags: [{ type: "Wallet", id: "TRANSACTIONS" }]
    })
  })
});

export const { useGetTokenWalletQuery, useListTokenWalletTransactionsQuery } = walletApi;

export function getTransactionTypeLabel(type: TransactionTypeEnum | string): string {
  if (type === "initial_grant") return "اعتبار اولیه";
  if (type === "manual_grant") return "شارژ توسط ادمین";
  if (type === "pricebook_line_usage") return "ثبت ردیف فهرست‌بها";
  if (type === "token_package_purchase") return "خرید بسته توکن";
  return type;
}

function billingErrorOf(error: unknown): { status: number; data: TokenBillingError } | null {
  if (typeof error !== "object" || !error || !("status" in error) || !("data" in error)) {
    return null;
  }
  const status = (error as { status?: unknown }).status;
  const data = (error as { data?: unknown }).data;
  if (typeof status !== "number" || typeof data !== "object" || !data || !("code" in data)) {
    return null;
  }
  return { status, data: data as TokenBillingError };
}

export function isInsufficientTokenBalance(
  error: unknown
): error is { status: 402; data: TokenBillingError } {
  const parsed = billingErrorOf(error);
  return parsed?.status === 402 && parsed.data.code === "INSUFFICIENT_TOKEN_BALANCE";
}

export function isIdempotencyKeyReused(
  error: unknown
): error is { status: 409; data: TokenBillingError } {
  const parsed = billingErrorOf(error);
  return parsed?.status === 409 && parsed.data.code === "IDEMPOTENCY_KEY_REUSED";
}

export function formatInsufficientBalanceMessage(data: TokenBillingError): string {
  const required = data.required_tokens?.trim();
  const available = data.available_tokens?.trim();
  if (required && available) {
    return `موجودی توکن کافی نیست. موردنیاز: ${required} توکن، موجودی: ${available} توکن. شارژ فعلاً از طریق ادمین انجام می‌شود.`;
  }
  return "موجودی توکن برای ثبت این ردیف کافی نیست. شارژ فعلاً از طریق ادمین انجام می‌شود.";
}

export function createLineIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `line-${crypto.randomUUID()}`;
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
