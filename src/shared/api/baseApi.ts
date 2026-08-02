import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta
} from "@reduxjs/toolkit/query/react";

import {
  clearLegacyAuthStorage,
  getCsrfHeaderToken,
  isMutatingMethod,
  setCsrfTokenFromApi
} from "../../features/auth/csrf";

clearLegacyAuthStorage();

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrf = getCsrfHeaderToken();
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    }

    // Session cookies are the browser auth contract. Never send v0 Token headers.
    headers.delete("Authorization");
    return headers;
  }
});

function captureCsrfFromResult(result: { data?: unknown }) {
  const data = result.data;
  if (typeof data === "object" && data && "csrf_token" in data) {
    const token = (data as { csrf_token?: unknown }).csrf_token;
    if (typeof token === "string" && token.trim()) {
      setCsrfTokenFromApi(token);
    }
  }
}

async function ensureCsrfToken(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
) {
  if (getCsrfHeaderToken()) {
    return;
  }

  const csrfResult = await rawBaseQuery({ url: "/api/auth/csrf/", method: "GET" }, api, extraOptions);
  captureCsrfFromResult(csrfResult);
}

const SESSION_ROTATING_PATHS = new Set([
  "/api/auth/login/",
  "/api/auth/signup/complete/",
  "/api/auth/logout/"
]);

function requestPath(url: string): string {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return new URL(url).pathname;
    }
  } catch {
    // fall through
  }
  return url.split("?")[0] ?? url;
}

export const baseQueryWithCsrf: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (
  args,
  api,
  extraOptions
) => {
  const request: FetchArgs = typeof args === "string" ? { url: args } : { ...args };
  const method = (request.method ?? "GET").toUpperCase();
  const path = requestPath(request.url);

  if (isMutatingMethod(method)) {
    await ensureCsrfToken(api, extraOptions);
    const csrf = getCsrfHeaderToken();
    if (csrf) {
      request.headers = {
        ...(request.headers as Record<string, string> | undefined),
        "X-CSRFToken": csrf
      };
    }
  }

  let result = await rawBaseQuery(request, api, extraOptions);
  captureCsrfFromResult(result);

  // Login/signup/logout rotate the CSRF cookie; drop the stale masked token.
  if (!result.error && SESSION_ROTATING_PATHS.has(path)) {
    setCsrfTokenFromApi(null);
  }

  const shouldRetryCsrf =
    Boolean(result.error) &&
    result.error?.status === 403 &&
    isMutatingMethod(method) &&
    path !== "/api/auth/csrf/";

  if (shouldRetryCsrf) {
    setCsrfTokenFromApi(null);
    const csrfRefresh = await rawBaseQuery({ url: "/api/auth/csrf/", method: "GET" }, api, extraOptions);
    captureCsrfFromResult(csrfRefresh);
    const csrf = getCsrfHeaderToken();
    if (csrf) {
      request.headers = {
        ...(request.headers as Record<string, string> | undefined),
        "X-CSRFToken": csrf
      };
    }
    result = await rawBaseQuery(request, api, extraOptions);
    captureCsrfFromResult(result);
    if (!result.error && SESSION_ROTATING_PATHS.has(path)) {
      setCsrfTokenFromApi(null);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "ratabApi",
  baseQuery: baseQueryWithCsrf,
  tagTypes: [
    "Auth",
    "Coefficient",
    "Company",
    "CompanyGroup",
    "CompanyInvitation",
    "CompanyMember",
    "CompanyWallet",
    "FinancialDocument",
    "GroupMessage",
    "Health",
    "MessageQuota",
    "PlatformAdmin",
    "Pricebook",
    "PrivateFile",
    "Project",
    "Subscription",
    "SupportTicket",
    "Wallet"
  ],
  endpoints: () => ({})
});
