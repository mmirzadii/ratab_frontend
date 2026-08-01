import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateMathExpression,
  getMathExpressionPreview,
  isMeaningfulMathExpression,
  normalizeMathExpression
} from "./mathExpression.ts";
import { formatMathResult } from "./mathResult.ts";
import {
  findExpressionBeforeCaret,
  replaceExpressionBeforeCaret
} from "./findExpressionBeforeCaret.ts";

describe("math expression evaluation", () => {
  it("respects arithmetic precedence", () => {
    assert.equal(evaluateMathExpression("2+3*4").ok && evaluateMathExpression("2+3*4").formatted, "14");
    const r = evaluateMathExpression("2+3*4");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "14");
  });

  it("evaluates parentheses", () => {
    const r = evaluateMathExpression("(12+8)/4");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "5");
  });

  it("uses right-associative exponentiation", () => {
    const r = evaluateMathExpression("2**3**2");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "512");
  });

  it("supports unary operators", () => {
    const r = evaluateMathExpression("-3+5");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "2");
  });

  it("supports square root", () => {
    const r = evaluateMathExpression("sqrt(81)+5");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "14");
  });

  it("uses degree-based sine cosine tangent", () => {
    const sin = evaluateMathExpression("sin(30)");
    assert.equal(sin.ok, true);
    if (sin.ok) assert.equal(sin.formatted, "0.5");
    const cos = evaluateMathExpression("cos(60)*20");
    assert.equal(cos.ok, true);
    if (cos.ok) assert.equal(cos.formatted, "10");
    const tan = evaluateMathExpression("tan(45)");
    assert.equal(tan.ok, true);
    if (tan.ok) assert.equal(tan.formatted, "1");
  });

  it("supports pi and e", () => {
    const pi = evaluateMathExpression("2*pi*5");
    assert.equal(pi.ok, true);
    if (pi.ok) assert.ok(Math.abs(pi.value - 2 * Math.PI * 5) < 1e-9);
    const e = evaluateMathExpression("e**2");
    assert.equal(e.ok, true);
    if (e.ok) assert.ok(Math.abs(e.value - Math.E ** 2) < 1e-9);
  });

  it("accepts localized digits and operators", () => {
    const r = evaluateMathExpression("۳×۴");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "12");
    const div = evaluateMathExpression("۱۰÷۴");
    assert.equal(div.ok, true);
    if (div.ok) assert.equal(div.formatted, "2.5");
  });

  it("ignores all horizontal whitespace including spaced function names", () => {
    assert.equal(normalizeMathExpression("s i n ( 3 0 )"), "sin(30)");
    const r = evaluateMathExpression("s i n ( 3 0 )");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "0.5");
    const spaced = evaluateMathExpression("2     +     3*4");
    assert.equal(spaced.ok, true);
    if (spaced.ok) assert.equal(spaced.formatted, "14");
  });

  it("supports nested functions", () => {
    const r = evaluateMathExpression("sqrt(sin(30)+0.5)");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.formatted, "1");
  });

  it("rejects division by zero", () => {
    assert.equal(evaluateMathExpression("1/0").ok, false);
  });

  it("rejects negative square root", () => {
    assert.equal(evaluateMathExpression("sqrt(-1)").ok, false);
  });

  it("rejects undefined tangent", () => {
    assert.equal(evaluateMathExpression("tan(90)").ok, false);
    assert.equal(evaluateMathExpression("tan(270)").ok, false);
  });

  it("rejects unknown identifiers and injection strings", () => {
    assert.equal(evaluateMathExpression("foo(1)").ok, false);
    assert.equal(evaluateMathExpression("alert(1)").ok, false);
    assert.equal(evaluateMathExpression("constructor").ok, false);
    assert.equal(evaluateMathExpression("2^3").ok, false);
    assert.equal(evaluateMathExpression("2pi").ok, false);
    assert.equal(evaluateMathExpression("2(3+4)").ok, false);
  });

  it("rejects excessive exponent depth and length", () => {
    assert.equal(evaluateMathExpression("2**101").ok, false);
    assert.equal(evaluateMathExpression("1+" + "1+".repeat(120) + "1").ok, false);
  });

  it("formats results stably without float noise", () => {
    assert.equal(formatMathResult(0.1 + 0.2), "0.3");
    assert.equal(formatMathResult(-0), "0");
    const sum = evaluateMathExpression("0.1+0.2");
    assert.equal(sum.ok, true);
    if (sum.ok) assert.equal(sum.formatted, "0.3");
    assert.equal(getMathExpressionPreview("125"), null);
    assert.equal(isMeaningfulMathExpression("125"), false);
    assert.equal(isMeaningfulMathExpression("3**4"), true);
    const pow = evaluateMathExpression("3**4");
    assert.equal(pow.ok, true);
    if (pow.ok) assert.equal(pow.formatted, "81");
  });
});

describe("findExpressionBeforeCaret", () => {
  it("selects the longest valid expression before the caret", () => {
    const text = "مبلغ نهایی برابر است با (25 + 5) * 3";
    const caret = text.length;
    const match = findExpressionBeforeCaret(text, caret);
    assert.ok(match);
    assert.equal(match?.expression, "(25 + 5) * 3");
    assert.equal(match?.result, "90");
  });

  it("stops at the current line boundary", () => {
    const text = "2+3\n(10+2)*4";
    const caret = text.length;
    const match = findExpressionBeforeCaret(text, caret);
    assert.ok(match);
    assert.equal(match?.expression, "(10+2)*4");
    assert.equal(match?.result, "48");
  });

  it("picks the expression at the caret among multiple expressions", () => {
    const text = "اول 2+3 و بعد (10 + 2) * 4";
    const afterFirst = text.indexOf("2+3") + "2+3".length;
    const first = findExpressionBeforeCaret(text, afterFirst);
    assert.equal(first?.expression, "2+3");
    const afterSecond = text.length;
    const second = findExpressionBeforeCaret(text, afterSecond);
    assert.equal(second?.expression, "(10 + 2) * 4");
  });

  it("ignores internal whitespace and excludes Persian prose", () => {
    const text = "نتیجه  2  +  3";
    const match = findExpressionBeforeCaret(text, text.length);
    assert.equal(match?.expression, "2  +  3");
    assert.equal(match?.result, "5");
  });

  it("preserves trailing whitespace outside the expression", () => {
    const text = "2+3  ";
    const match = findExpressionBeforeCaret(text, text.length);
    assert.ok(match);
    assert.equal(match?.end, 3);
    const replaced = replaceExpressionBeforeCaret(text, match!);
    assert.equal(replaced.text, "5  ");
  });

  it("does not highlight plain numbers", () => {
    assert.equal(findExpressionBeforeCaret("125", 3), null);
  });

  it("disables detection when a selection is active", () => {
    assert.equal(
      findExpressionBeforeCaret("2+3", 3, { selectionStart: 0, selectionEnd: 3 }),
      null
    );
  });

  it("detects localized expressions", () => {
    const text = "جمع ۳×۴";
    const match = findExpressionBeforeCaret(text, text.length);
    assert.equal(match?.result, "12");
  });
});
