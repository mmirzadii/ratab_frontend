import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError
} from "@reduxjs/toolkit/query/react";

import { clearLegacyAuthStorage, isMutatingMethod, readCsrfCookie } from "../../features/auth/csrf";

clearLegacyAuthStorage();

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrf = readCsrfCookie();
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    }

    // Session cookies are the browser auth contract. Never send v0 Token headers.
    headers.delete("Authorization");
    return headers;
  }
});

async function ensureCsrfCookie(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
) {
  if (readCsrfCookie()) {
    return;
  }

  await rawBaseQuery({ url: "/api/auth/csrf/", method: "GET" }, api, extraOptions);
}

export const baseQueryWithCsrf: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const request: FetchArgs = typeof args === "string" ? { url: args } : { ...args };
  const method = (request.method ?? "GET").toUpperCase();

  if (isMutatingMethod(method)) {
    await ensureCsrfCookie(api, extraOptions);
    const csrf = readCsrfCookie();
    if (csrf) {
      request.headers = {
        ...(request.headers as Record<string, string> | undefined),
        "X-CSRFToken": csrf
      };
    }
  }

  let result = await rawBaseQuery(request, api, extraOptions);

  const shouldRetryCsrf =
    Boolean(result.error) &&
    result.error?.status === 403 &&
    isMutatingMethod(method) &&
    request.url !== "/api/auth/csrf/";

  if (shouldRetryCsrf) {
    await rawBaseQuery({ url: "/api/auth/csrf/", method: "GET" }, api, extraOptions);
    const csrf = readCsrfCookie();
    if (csrf) {
      request.headers = {
        ...(request.headers as Record<string, string> | undefined),
        "X-CSRFToken": csrf
      };
    }
    result = await rawBaseQuery(request, api, extraOptions);
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
    "FinancialDocument",
    "Health",
    "Pricebook",
    "Project"
  ],
  endpoints: () => ({})
});
