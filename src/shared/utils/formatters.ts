export function formatMoneyAmount(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  const rawValue =
    typeof value === "number" ? String(Math.trunc(value)) : value.trim();

  if (!rawValue) {
    return "—";
  }

  const match = rawValue.match(/^([+-]?)(\d+)(?:\.\d+)?$/);

  if (!match) {
    return rawValue;
  }

  const [, sign, integerPart] = match;
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const groupedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}${groupedInteger}`;
}

export function formatDecimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const str = typeof value === "number" ? String(value) : String(value).trim();
  if (!str) return "—";
  if (!str.includes(".")) return str;
  const stripped = str.replace(/\.?0+$/, "");
  return stripped || "0";
}

const mojibakeMarkers = ["Ã", "Â", "�", "Ø", "Ù", "Û", "Ú"];

export function isMojibakeText(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  return mojibakeMarkers.some((marker) => value.includes(marker));
}

export function cleanDisplayText(
  value: number | string | null | undefined,
  fallback = "—"
) {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();

  if (!text || isMojibakeText(text)) {
    return fallback;
  }

  return text;
}
