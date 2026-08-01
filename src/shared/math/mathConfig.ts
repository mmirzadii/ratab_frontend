/** Shared safety limits for the frontend math-expression engine. */

export const MATH_MAX_EXPRESSION_LENGTH = 240;
export const MATH_MAX_TOKEN_COUNT = 200;
export const MATH_MAX_DEPTH = 16;
export const MATH_MAX_EXPONENT_MAGNITUDE = 100;
export const MATH_MAX_ABS_RESULT = 1e15;

/** Near-zero cosine for rejecting undefined tan(degrees). */
export const MATH_TAN_COSINE_EPSILON = 1e-12;

/** Absolute values below this format as `0`. */
export const MATH_ZERO_EPSILON = 1e-12;

/** Distance to nearest integer below this snaps to that integer. */
export const MATH_INTEGER_EPSILON = 1e-10;

export const MATH_MAX_FRACTION_DIGITS = 12;

/** Composer scans at most this many characters before the caret on the current line. */
export const MATH_CARET_SCAN_WINDOW = 300;

export const MATH_TAB_HINT_TITLE_FA = "برای محاسبه Tab را فشار دهید";

export const MATH_MOBILE_APPLY_LABEL_FA = "محاسبه عبارت";
