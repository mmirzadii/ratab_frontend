import { MATH_CARET_SCAN_WINDOW } from "./mathConfig.ts";
import { evaluateMathExpression } from "./mathExpression.ts";

export type ExpressionBeforeCaret = {
  /** Absolute start index in the full text. */
  start: number;
  /** Absolute end index (exclusive) in the full text — expression text without trailing whitespace. */
  end: number;
  /** Original expression substring (preserves internal spacing). */
  expression: string;
  /** Formatted Latin result. */
  result: string;
};

function isHorizontalWhitespace(ch: string): boolean {
  return /[\u0009\u000B\u000C\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\u200B\uFEFF\u180E]/.test(
    ch
  );
}

/**
 * Find the longest valid meaningful math expression ending immediately before the caret
 * on the current line (newlines are hard boundaries). Returns null for plain numbers,
 * incomplete expressions, or when a non-collapsed selection is active.
 */
export function findExpressionBeforeCaret(
  text: string,
  caret: number,
  options?: { selectionStart?: number; selectionEnd?: number }
): ExpressionBeforeCaret | null {
  const selectionStart = options?.selectionStart ?? caret;
  const selectionEnd = options?.selectionEnd ?? caret;
  if (selectionStart !== selectionEnd) return null;

  const safeCaret = Math.max(0, Math.min(caret, text.length));
  const before = text.slice(0, safeCaret);
  const lineBreak = Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r"));
  const lineStart = lineBreak + 1;
  let linePrefix = before.slice(lineStart);
  if (linePrefix.length > MATH_CARET_SCAN_WINDOW) {
    linePrefix = linePrefix.slice(linePrefix.length - MATH_CARET_SCAN_WINDOW);
  }

  let endInPrefix = linePrefix.length;
  while (endInPrefix > 0 && isHorizontalWhitespace(linePrefix[endInPrefix - 1]!)) {
    endInPrefix -= 1;
  }
  if (endInPrefix === 0) return null;

  const absoluteEnd = safeCaret - (linePrefix.length - endInPrefix);
  const scanWindowStart = absoluteEnd - endInPrefix;

  let best: ExpressionBeforeCaret | null = null;
  for (let startInPrefix = 0; startInPrefix < endInPrefix; startInPrefix += 1) {
    let trimmedStart = startInPrefix;
    while (
      trimmedStart < endInPrefix &&
      isHorizontalWhitespace(linePrefix[trimmedStart]!)
    ) {
      trimmedStart += 1;
    }
    if (trimmedStart >= endInPrefix) continue;
    const candidate = linePrefix.slice(trimmedStart, endInPrefix);
    if (!candidate) continue;
    const evaluated = evaluateMathExpression(candidate);
    if (!evaluated.ok || !evaluated.meaningful) continue;
    const absoluteStart = scanWindowStart + trimmedStart;
    const length = absoluteEnd - absoluteStart;
    if (!best || length > best.end - best.start) {
      best = {
        start: absoluteStart,
        end: absoluteEnd,
        expression: text.slice(absoluteStart, absoluteEnd),
        result: evaluated.formatted
      };
    }
  }
  return best;
}

/**
 * Replace the detected expression span with its formatted result.
 * Returns the new full text and caret position after the inserted result.
 */
export function replaceExpressionBeforeCaret(
  text: string,
  match: ExpressionBeforeCaret
): { text: string; caret: number } {
  const next = text.slice(0, match.start) + match.result + text.slice(match.end);
  return { text: next, caret: match.start + match.result.length };
}
