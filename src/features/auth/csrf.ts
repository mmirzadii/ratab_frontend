const CSRF_COOKIE_NAMES = ["csrftoken", "csrf_token"] as const;

/** Clear obsolete v0 client token storage. Do not store session IDs or passwords. */
export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem("ratab.devAuth.token");
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

export function isMutatingMethod(method?: string): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized !== "GET" && normalized !== "HEAD" && normalized !== "OPTIONS";
}
