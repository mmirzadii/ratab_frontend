import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type AppUser = components["schemas"]["AppUser"];
export type DevLoginRequest = components["schemas"]["DevLoginRequest"];
export type DevLoginResponse = components["schemas"]["DevLoginResponse"];

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    devLogin: builder.mutation<DevLoginResponse, DevLoginRequest>({
      query: (body) => ({
        url: "/api/auth/dev-login/",
        method: "POST",
        body
      }),
      invalidatesTags: ["Auth"]
    }),
    getCurrentUser: builder.query<AppUser, void>({
      query: () => "/api/auth/me/",
      providesTags: ["Auth"]
    })
  })
});

export const { useDevLoginMutation, useGetCurrentUserQuery } = authApi;
