const AUTH_TOKEN_KEY = "ratab.devAuth.token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string) {
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
}
