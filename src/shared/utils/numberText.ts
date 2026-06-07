const PERSIAN_ZERO_CODE = "۰".charCodeAt(0);
const ARABIC_ZERO_CODE = "٠".charCodeAt(0);

export function normalizePersianDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const code = char.charCodeAt(0);

    if (code >= PERSIAN_ZERO_CODE && code <= PERSIAN_ZERO_CODE + 9) {
      return String(code - PERSIAN_ZERO_CODE);
    }

    return String(code - ARABIC_ZERO_CODE);
  });
}

export function normalizeNumberInput(value: string): string {
  return normalizePersianDigits(value).trim();
}

export function normalizeRowCode(value: string): string {
  return normalizePersianDigits(value).trim();
}

export function containsLocalizedDigits(value: string): boolean {
  return /[۰-۹٠-٩]/.test(value);
}
