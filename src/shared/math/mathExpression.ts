import {
  MATH_MAX_ABS_RESULT,
  MATH_MAX_DEPTH,
  MATH_MAX_EXPONENT_MAGNITUDE,
  MATH_MAX_EXPRESSION_LENGTH,
  MATH_MAX_TOKEN_COUNT,
  MATH_TAN_COSINE_EPSILON
} from "./mathConfig.ts";
import { formatMathResult } from "./mathResult.ts";

export type MathEvalOk = { ok: true; value: number; formatted: string; meaningful: boolean };
export type MathEvalErr = { ok: false; reason: string };
export type MathEvalResult = MathEvalOk | MathEvalErr;

type TokenKind =
  | "number"
  | "ident"
  | "plus"
  | "minus"
  | "star"
  | "slash"
  | "starstar"
  | "lparen"
  | "rparen"
  | "eof";

type Token = { kind: TokenKind; value?: string; index: number };

const FUNCTION_NAMES = new Set(["sin", "cos", "tan", "sqrt"]);
const CONSTANT_NAMES = new Set(["pi", "e"]);

/** Horizontal Unicode whitespace removed before tokenization. */
const HORIZONTAL_WS =
  // eslint-disable-next-line no-control-regex -- Unicode horizontal whitespace matching
  /[\u0009\u000B\u000C\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\u200B\uFEFF\u180E]/g;

const PERSIAN_ZERO = "۰".charCodeAt(0);
const ARABIC_ZERO = "٠".charCodeAt(0);

function mapLocalizedDigit(char: string): string | null {
  const code = char.charCodeAt(0);
  if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
    return String(code - PERSIAN_ZERO);
  }
  if (code >= ARABIC_ZERO && code <= ARABIC_ZERO + 9) {
    return String(code - ARABIC_ZERO);
  }
  return null;
}

/**
 * Normalize localized digits/operators for math, then strip all horizontal whitespace.
 * Does not alter newlines (callers must not pass multi-line expressions).
 */
export function normalizeMathExpression(raw: string): string {
  let out = "";
  for (const char of raw) {
    if (char === "\n" || char === "\r") {
      // Newlines are hard boundaries; treat as invalid inside an expression.
      out += char;
      continue;
    }
    const digit = mapLocalizedDigit(char);
    if (digit !== null) {
      out += digit;
      continue;
    }
    if (char === "×" || char === "∗" || char === "⋅") {
      out += "*";
      continue;
    }
    if (char === "÷") {
      out += "/";
      continue;
    }
    if (char === "٫") {
      out += ".";
      continue;
    }
    if (char === "−" || char === "–" || char === "—" || char === "﹣" || char === "－") {
      out += "-";
      continue;
    }
    // Thousands separators between digits are dropped later in the number lexer;
    // strip them here only when clearly separators (٬ and ,).
    if (char === "٬" || char === ",") {
      continue;
    }
    out += char;
  }
  return out.replace(HORIZONTAL_WS, "");
}

function isIdentStart(ch: string): boolean {
  return /[A-Za-z]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

export function tokenizeMathExpression(normalized: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < normalized.length) {
    if (tokens.length >= MATH_MAX_TOKEN_COUNT) return null;
    const ch = normalized[i]!;
    if (ch === "+") {
      tokens.push({ kind: "plus", index: i });
      i += 1;
      continue;
    }
    if (ch === "-") {
      tokens.push({ kind: "minus", index: i });
      i += 1;
      continue;
    }
    if (ch === "*") {
      if (normalized[i + 1] === "*") {
        tokens.push({ kind: "starstar", index: i });
        i += 2;
      } else {
        tokens.push({ kind: "star", index: i });
        i += 1;
      }
      continue;
    }
    if (ch === "/") {
      tokens.push({ kind: "slash", index: i });
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen", index: i });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen", index: i });
      i += 1;
      continue;
    }
    if (isDigit(ch) || (ch === "." && i + 1 < normalized.length && isDigit(normalized[i + 1]!))) {
      const start = i;
      let sawDot = false;
      while (i < normalized.length) {
        const c = normalized[i]!;
        if (isDigit(c)) {
          i += 1;
          continue;
        }
        if (c === "." && !sawDot) {
          sawDot = true;
          i += 1;
          continue;
        }
        break;
      }
      const rawNum = normalized.slice(start, i);
      if (rawNum === "." || rawNum.endsWith(".")) return null;
      tokens.push({ kind: "number", value: rawNum, index: start });
      continue;
    }
    if (isIdentStart(ch)) {
      const start = i;
      i += 1;
      while (i < normalized.length && isIdentPart(normalized[i]!)) i += 1;
      const name = normalized.slice(start, i).toLowerCase();
      tokens.push({ kind: "ident", value: name, index: start });
      continue;
    }
    // Reject ^ and every other character.
    return null;
  }
  tokens.push({ kind: "eof", index: normalized.length });
  return tokens;
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

class MathParser {
  private readonly tokens: Token[];
  private pos = 0;
  private depth = 0;
  meaningful = false;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): number {
    const value = this.parseExpr();
    if (this.current().kind !== "eof") {
      throw new Error("trailing");
    }
    return value;
  }

  private current(): Token {
    return this.tokens[this.pos] ?? { kind: "eof", index: -1 };
  }

  private consume(): Token {
    const token = this.current();
    this.pos += 1;
    return token;
  }

  private enter(): void {
    this.depth += 1;
    if (this.depth > MATH_MAX_DEPTH) throw new Error("depth");
  }

  private leave(): void {
    this.depth -= 1;
  }

  private parseExpr(): number {
    let value = this.parseTerm();
    for (;;) {
      const kind = this.current().kind;
      if (kind === "plus") {
        this.meaningful = true;
        this.consume();
        value = value + this.parseTerm();
      } else if (kind === "minus") {
        this.meaningful = true;
        this.consume();
        value = value - this.parseTerm();
      } else {
        break;
      }
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseUnary();
    for (;;) {
      const kind = this.current().kind;
      if (kind === "star") {
        this.meaningful = true;
        this.consume();
        value = value * this.parseUnary();
      } else if (kind === "slash") {
        this.meaningful = true;
        this.consume();
        const right = this.parseUnary();
        if (right === 0) throw new Error("div0");
        value = value / right;
      } else {
        break;
      }
    }
    return value;
  }

  private parseUnary(): number {
    if (this.current().kind === "plus") {
      this.meaningful = true;
      this.consume();
      return this.parseUnary();
    }
    if (this.current().kind === "minus") {
      this.meaningful = true;
      this.consume();
      return -this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    if (this.current().kind === "starstar") {
      this.meaningful = true;
      this.consume();
      const exp = this.parseUnary();
      if (Math.abs(exp) > MATH_MAX_EXPONENT_MAGNITUDE) throw new Error("exp");
      if (base < 0 && !Number.isInteger(exp)) throw new Error("pow");
      const result = base ** exp;
      if (!Number.isFinite(result)) throw new Error("pow");
      return result;
    }
    return base;
  }

  private parsePrimary(): number {
    this.enter();
    try {
      const token = this.current();
      if (token.kind === "number") {
        this.consume();
        const n = Number(token.value);
        if (!Number.isFinite(n)) throw new Error("number");
        return n;
      }
      if (token.kind === "ident") {
        const name = token.value ?? "";
        this.consume();
        if (CONSTANT_NAMES.has(name)) {
          this.meaningful = true;
          return name === "pi" ? Math.PI : Math.E;
        }
        if (FUNCTION_NAMES.has(name)) {
          this.meaningful = true;
          if (this.current().kind !== "lparen") throw new Error("call");
          this.consume();
          const arg = this.parseExpr();
          if (this.current().kind !== "rparen") throw new Error("call");
          this.consume();
          return this.applyFunction(name, arg);
        }
        throw new Error("ident");
      }
      if (token.kind === "lparen") {
        this.consume();
        const value = this.parseExpr();
        if (this.current().kind !== "rparen") throw new Error("paren");
        this.consume();
        return value;
      }
      throw new Error("primary");
    } finally {
      this.leave();
    }
  }

  private applyFunction(name: string, arg: number): number {
    if (name === "sqrt") {
      if (arg < 0) throw new Error("sqrt");
      return Math.sqrt(arg);
    }
    if (name === "sin") return Math.sin(degreesToRadians(arg));
    if (name === "cos") return Math.cos(degreesToRadians(arg));
    if (name === "tan") {
      const rad = degreesToRadians(arg);
      if (Math.abs(Math.cos(rad)) < MATH_TAN_COSINE_EPSILON) throw new Error("tan");
      const result = Math.tan(rad);
      if (!Number.isFinite(result)) throw new Error("tan");
      return result;
    }
    throw new Error("fn");
  }
}

function isSafeResult(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= MATH_MAX_ABS_RESULT;
}

/**
 * Safely evaluate a math expression. Never uses eval/Function.
 */
export function evaluateMathExpression(raw: string): MathEvalResult {
  if (raw.includes("\n") || raw.includes("\r")) {
    return { ok: false, reason: "newline" };
  }
  const normalized = normalizeMathExpression(raw);
  if (!normalized) return { ok: false, reason: "empty" };
  if (normalized.length > MATH_MAX_EXPRESSION_LENGTH) {
    return { ok: false, reason: "length" };
  }
  const tokens = tokenizeMathExpression(normalized);
  if (!tokens) return { ok: false, reason: "token" };
  if (tokens.length - 1 > MATH_MAX_TOKEN_COUNT) {
    return { ok: false, reason: "tokens" };
  }
  try {
    const parser = new MathParser(tokens);
    const value = parser.parse();
    if (!isSafeResult(value)) return { ok: false, reason: "range" };
    const formatted = formatMathResult(value);
    if (formatted === null) return { ok: false, reason: "format" };
    return { ok: true, value, formatted, meaningful: parser.meaningful };
  } catch {
    return { ok: false, reason: "parse" };
  }
}

/** True when the text is a complete, meaningful math expression (not a plain number). */
export function isMeaningfulMathExpression(raw: string): boolean {
  const result = evaluateMathExpression(raw);
  return result.ok && result.meaningful;
}

/**
 * Live preview for UI hints: only for meaningful valid expressions.
 */
export function getMathExpressionPreview(raw: string): string | null {
  const result = evaluateMathExpression(raw);
  if (!result.ok || !result.meaningful) return null;
  return result.formatted;
}

/**
 * Resolve a financial numeric field to a canonical Latin numeric string.
 * Meaningful expressions are evaluated; otherwise digits are normalized like quantity fields.
 */
export function resolveFinancialNumericInput(
  raw: string,
  normalizePlain: (value: string) => string
): { ok: true; value: string; fromExpression: boolean } | { ok: false } {
  const evaluated = evaluateMathExpression(raw);
  if (evaluated.ok && evaluated.meaningful) {
    return { ok: true, value: evaluated.formatted, fromExpression: true };
  }
  const plain = normalizePlain(raw);
  if (plain !== "" && /^-?\d+(\.\d+)?$/.test(plain)) {
    return { ok: true, value: plain.replace(/^-0$/, "0"), fromExpression: false };
  }
  // Plain number that parsed via the math engine (e.g. with spaces around digits).
  if (evaluated.ok && !evaluated.meaningful) {
    return { ok: true, value: evaluated.formatted, fromExpression: false };
  }
  return { ok: false };
}
