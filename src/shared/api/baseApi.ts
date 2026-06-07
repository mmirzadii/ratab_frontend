import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

export const baseApi = createApi({
  reducerPath: "ratabApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl
  }),
  tagTypes: ["Health"],
  endpoints: () => ({})
});
