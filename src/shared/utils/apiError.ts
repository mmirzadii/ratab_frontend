export function getApiErrorMessage(
  error: unknown,
  fallback = "در ارتباط با سرور خطایی رخ داد. لطفاً دوباره تلاش کنید."
): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object" && data && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  }

  return fallback;
}
