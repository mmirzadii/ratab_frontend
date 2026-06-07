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
