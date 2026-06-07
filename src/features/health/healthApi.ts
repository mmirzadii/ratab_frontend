import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type HealthResponse = components["schemas"]["HealthResponse"];

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/api/health/",
      providesTags: ["Health"]
    })
  })
});

export const { useGetHealthQuery } = healthApi;
