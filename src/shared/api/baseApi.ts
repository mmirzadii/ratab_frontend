import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { getStoredAuthToken } from "../../features/auth/tokenStorage";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

export const baseApi = createApi({
  reducerPath: "ratabApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      const token = getStoredAuthToken();

      if (token) {
        headers.set("Authorization", `Token ${token}`);
      }

      return headers;
    }
  }),
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
