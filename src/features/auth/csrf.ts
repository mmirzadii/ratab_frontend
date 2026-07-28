const CSRF_COOKIE_NAMES = ["csrftoken", "csrf_token"] as const;

/** In-memory masked CSRF token from GET /api/auth/csrf/. Not a session ID or password. */
let csrfTokenFromApi: string | null = null;

/** Clear obsolete v0 client token storage. Do not store session IDs or passwords. */
export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem("ratab.devAuth.token");
}

export function setCsrfTokenFromApi(token: string | null | undefined) {
  const normalized = typeof token === "string" ? token.trim() : "";
  csrfTokenFromApi = normalized || null;
}

export function getCsrfTokenFromApi(): string | null {
  return csrfTokenFromApi;
}

export function readCsrfCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").map((part) => part.trim());

  for (const name of CSRF_COOKIE_NAMES) {
    const prefix = `${name}=`;
    const match = cookies.find((cookie) => cookie.startsWith(prefix));
    if (!match) continue;
    return decodeURIComponent(match.slice(prefix.length));
  }

  return null;
}

/**
 * Prefer the masked token returned by GET /api/auth/csrf/.
 * Cross-origin API hosts cannot expose Host-only cookies to document.cookie.
 */
export function getCsrfHeaderToken(): string | null {
  return getCsrfTokenFromApi() ?? readCsrfCookie();
}

export function isMutatingMethod(method?: string): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized !== "GET" && normalized !== "HEAD" && normalized !== "OPTIONS";
}

export function looksLikeHtmlPayload(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim().slice(0, 200).toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("<body") ||
    trimmed.includes("csrf verification failed") ||
    trimmed.includes("origin checking failed")
  );
}
