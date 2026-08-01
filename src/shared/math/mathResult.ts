import {
  MATH_INTEGER_EPSILON,
  MATH_MAX_ABS_RESULT,
  MATH_MAX_FRACTION_DIGITS,
  MATH_ZERO_EPSILON
} from "./mathConfig.ts";

/**
 * Canonical Latin numeric string for UI display and backend payloads.
 * Removes floating-point noise; never emits `-0` or scientific notation in range.
 */
export function formatMathResult(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  if (Math.abs(value) > MATH_MAX_ABS_RESULT) return null;
  if (Object.is(value, -0) || Math.abs(value) < MATH_ZERO_EPSILON) {
    return "0";
  }

  const nearest = Math.round(value);
  if (Math.abs(value - nearest) < MATH_INTEGER_EPSILON) {
    if (Math.abs(nearest) > MATH_MAX_ABS_RESULT) return null;
    return String(nearest === 0 ? 0 : nearest);
  }

  // Round to a stable decimal grid, then trim trailing zeros.
  const fixed = value.toFixed(MATH_MAX_FRACTION_DIGITS);
  let trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  if (trimmed === "-0") trimmed = "0";
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;

  const asNumber = Number(trimmed);
  if (!Number.isFinite(asNumber) || Math.abs(asNumber) > MATH_MAX_ABS_RESULT) {
    return null;
  }
  if (Object.is(asNumber, -0) || Math.abs(asNumber) < MATH_ZERO_EPSILON) {
    return "0";
  }
  return trimmed;
}
