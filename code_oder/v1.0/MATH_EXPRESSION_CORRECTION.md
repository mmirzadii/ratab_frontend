# Safe mathematical expressions (frontend-only)

Last updated: 2026-08-01

## Summary

Users can enter safe mathematical expressions in financial numeric inputs and in the message composer. Evaluation is entirely frontend-local. Backend numeric fields always receive canonical Latin numeric strings — never raw expressions.

## Supported syntax

- Operators: `+` `-` `*` `/` `**` (exponentiation; `^` is not supported)
- Parentheses: `( )`
- Functions (degrees for trig): `sin` `cos` `tan` `sqrt`
- Constants: `pi` `e`
- No implicit multiplication (`2pi` and `2(3+4)` are invalid; use `2*pi`, `2*(3+4)`)

## Whitespace

All horizontal Unicode whitespace is ignored for validation/evaluation only (visible spacing stays while typing). Newlines are hard expression boundaries.

## Localized input

Persian/Arabic digits, `×` `÷`, decimal `٫`, and localized minus variants are normalized before parsing.

## Safety

Whitelist tokenizer + recursive-descent parser (no `eval` / `Function`). Limits live in `src/shared/math/mathConfig.ts` (length, tokens, depth, exponent magnitude, abs result).

## Financial numeric UX

- Live result chip via `MathExpressionResultAction`
- Desktop: `= 81` + `Tab` (Tab converts; focus may continue)
- Mobile: `= 81` + compact `محاسبه` (tap applies; does not auto-advance)
- Blur still resolves valid values / rejects invalid non-math text
- Submit/Add still resolves via `normalizeQuantityValue` before backend payloads

Enabled fields: main quantity, schema/secondary calc inputs, footnote numbers, manual unit price, row custom prices, range-fallback custom price, starred quantity/unit price.

## Composer UX

- Longest valid meaningful expression before the caret (current line, bounded window)
- Subtle highlight overlay + result chip inside the composer
- Desktop Tab / mobile `محاسبه` share the same replace helper
- Tab with no expression keeps focus; Shift+Tab unchanged
- `Ctrl/⌘+Enter` also sends when allowed
- IME composition blocks replacement

## Modules

- `src/shared/math/mathConfig.ts`
- `src/shared/math/mathExpression.ts`
- `src/shared/math/mathResult.ts`
- `src/shared/math/findExpressionBeforeCaret.ts`
- `src/shared/math/MathNumericInput.tsx`
- `src/shared/math/MathExpressionResultAction.tsx`
- `src/shared/math/ComposerMathTextarea.tsx`
