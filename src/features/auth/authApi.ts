import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type AppUser = components["schemas"]["AppUser"];
export type CsrfTokenResponse = components["schemas"]["CsrfTokenResponse"];
export type PasswordLoginRequest = components["schemas"]["PasswordLoginRequest"];
export type SessionAuthResponse = components["schemas"]["SessionAuthResponse"];
export type SignupCompleteRequest = components["schemas"]["SignupCompleteRequest"];
export type SignupStartRequest = components["schemas"]["SignupStartRequest"];
export type SignupStartResponse = components["schemas"]["SignupStartResponse"];
export type SignupVerifyRequest = components["schemas"]["SignupVerifyRequest"];
export type SignupVerifyResponse = components["schemas"]["SignupVerifyResponse"];

async function readEmptyOrJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCsrf: builder.query<CsrfTokenResponse, void>({
      query: () => ({
        url: "/api/auth/csrf/",
        method: "GET"
      })
    }),
    signupStart: builder.mutation<SignupStartResponse, SignupStartRequest>({
      query: (body) => ({
        url: "/api/auth/signup/start/",
        method: "POST",
        body
      })
    }),
    signupVerify: builder.mutation<SignupVerifyResponse, SignupVerifyRequest>({
      query: (body) => ({
        url: "/api/auth/signup/verify/",
        method: "POST",
        body
      })
    }),
    signupComplete: builder.mutation<SessionAuthResponse, SignupCompleteRequest>({
      query: (body) => ({
        url: "/api/auth/signup/complete/",
        method: "POST",
        body
      }),
      invalidatesTags: ["Auth"]
    }),
    login: builder.mutation<SessionAuthResponse, PasswordLoginRequest>({
      query: (body) => ({
        url: "/api/auth/login/",
        method: "POST",
        body
      }),
      invalidatesTags: ["Auth"]
    }),
    logout: builder.mutation<null, void>({
      query: () => ({
        url: "/api/auth/logout/",
        method: "POST",
        responseHandler: readEmptyOrJson
      }),
      invalidatesTags: ["Auth"]
    }),
    getCurrentUser: builder.query<AppUser, void>({
      query: () => "/api/auth/me/",
      providesTags: ["Auth"]
    })
  })
});

export const {
  useGetCsrfQuery,
  useLazyGetCsrfQuery,
  useSignupStartMutation,
  useSignupVerifyMutation,
  useSignupCompleteMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery
} = authApi;
