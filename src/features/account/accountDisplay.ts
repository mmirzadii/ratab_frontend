/** Persian-facing plan/package price; IRR amounts labeled as تومان (not raw IRR). */
export function formatPlanPriceFa(
  priceAmount: string | number | null | undefined,
  currency: string | null | undefined
): string {
  const amount = typeof priceAmount === "number" ? String(priceAmount) : String(priceAmount ?? "").trim();
  if (!amount || /^0+(?:\.0+)?$/.test(amount)) return "رایگان";
  const match = amount.match(/^([+-]?)(\d+)(?:\.\d+)?$/);
  const formatted = match
    ? `${match[1]}${(match[2].replace(/^0+(?=\d)/, "") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
    : amount;
  const code = (currency ?? "").trim().toUpperCase();
  if (!code || code === "IRR" || code === "IRT" || code === "TOMAN") {
    return `${formatted} تومان`;
  }
  return `${formatted} ${code}`;
}

export function formatAttachmentLimitFa(bytes: number | null | undefined): string {
  if (bytes == null) return "بدون سقف پیوست";
  if (bytes <= 0) return "—";
  const mib = bytes / (1024 * 1024);
  if (mib >= 1) {
    const rounded = Number.isInteger(mib) ? String(mib) : mib.toFixed(1).replace(/\.0$/, "");
    return `${rounded} مگابایت`;
  }
  const kib = Math.max(1, Math.round(bytes / 1024));
  return `${kib} کیلوبایت`;
}

export function formatDailyMessageLimitFa(limit: number | null | undefined): string {
  if (limit == null) return "بدون سقف روزانه";
  return `${limit} پیام`;
}

export function userInitials(displayName: string | null | undefined): string {
  const text = (displayName ?? "").trim();
  if (!text) return "؟";
  return text.charAt(0);
}

/** Detect English backend prose that must not appear in the UI. */
export function looksLikeEnglishBackendText(value: string | null | undefined): boolean {
  const text = (value ?? "").trim();
  if (!text) return false;
  return /[A-Za-z]{3,}/.test(text);
}
