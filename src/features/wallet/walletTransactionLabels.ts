import type { components } from "../../shared/api/generated/schema";

export type TransactionTypeEnum = components["schemas"]["TransactionTypeEnum"];

export function getTransactionTypeLabel(type: TransactionTypeEnum | string): string {
  if (type === "initial_grant") return "اعتبار اولیه ثبت‌نام";
  if (type === "manual_grant") return "اصلاح توسط مدیر سیستم";
  if (type === "pricebook_line_usage") return "شارژ تاریخی ثبت ردیف";
  if (type === "token_package_purchase") return "خرید بسته توکن";
  if (type === "calculation_usage") return "محاسبه";
  if (type === "company_donation_debit") return "اهدای توکن به شرکت";
  if (type === "demo_package_credit") return "خرید بسته توکن";
  return "تراکنش توکن";
}

/** Persian title for a ledger row; never surfaces English backend `reason` text. */
export function getTransactionTitle(transaction: {
  transaction_type: TransactionTypeEnum | string;
  reason?: string | null;
}): string {
  const type = transaction.transaction_type;
  if (type === "calculation_usage") {
    const reason = (transaction.reason ?? "").toLowerCase();
    if (reason.includes("starred") || reason.includes("ستاره‌")) {
      return "محاسبه آیتم ستاره‌دار";
    }
    if (
      reason.includes("official") ||
      reason.includes("pricebook") ||
      reason.includes("فهرست")
    ) {
      return "محاسبه آیتم فهرست‌بها";
    }
    return "محاسبه";
  }
  return getTransactionTypeLabel(type);
}

export function isTokenCreditAmount(amount: string): boolean {
  return !amount.trim().startsWith("-");
}

export function formatSignedTokenAmount(amount: string): string {
  const trimmed = amount.trim();
  if (!trimmed) return "—";
  if (trimmed.startsWith("+") || trimmed.startsWith("-")) return trimmed;
  return isTokenCreditAmount(trimmed) ? `+${trimmed}` : trimmed;
}
