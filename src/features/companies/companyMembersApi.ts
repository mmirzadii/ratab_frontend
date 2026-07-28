import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type CompanyMember = components["schemas"]["CompanyMember"];
export type CompanyMemberAddRequest = components["schemas"]["CompanyMemberAddRequest"];
export type PaginatedCompanyMemberList = components["schemas"]["PaginatedCompanyMemberList"];
export type PatchedCompanyMemberRoleRequest = components["schemas"]["PatchedCompanyMemberRoleRequest"];
export type RoleEnum = components["schemas"]["RoleEnum"];

export const companyMembersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyMembers: builder.query<PaginatedCompanyMemberList, number>({
      query: (companyId) => `/api/companies/${companyId}/members/`,
      providesTags: (result, _error, companyId) => [
        { type: "CompanyMember", id: `COMPANY-${companyId}` },
        ...(result?.results ?? []).map((member) => ({
          type: "CompanyMember" as const,
          id: member.id
        }))
      ]
    }),
    addCompanyMember: builder.mutation<
      CompanyMember,
      { companyId: number; body: CompanyMemberAddRequest }
    >({
      query: ({ companyId, body }) => ({
        url: `/api/companies/${companyId}/members/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "CompanyMember", id: `COMPANY-${companyId}` }
      ]
    }),
    updateCompanyMemberRole: builder.mutation<
      CompanyMember,
      { companyId: number; memberId: number; body: PatchedCompanyMemberRoleRequest }
    >({
      query: ({ memberId, body }) => ({
        url: `/api/company-members/${memberId}/role/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { companyId, memberId }) => [
        { type: "CompanyMember", id: `COMPANY-${companyId}` },
        { type: "CompanyMember", id: memberId }
      ]
    }),
    deactivateCompanyMember: builder.mutation<
      CompanyMember,
      { companyId: number; memberId: number }
    >({
      query: ({ memberId }) => ({
        url: `/api/company-members/${memberId}/deactivate/`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { companyId, memberId }) => [
        { type: "CompanyMember", id: `COMPANY-${companyId}` },
        { type: "CompanyMember", id: memberId }
      ]
    }),
    removeCompanyMember: builder.mutation<null, { companyId: number; memberId: number }>({
      query: ({ memberId }) => ({
        url: `/api/company-members/${memberId}/`,
        method: "DELETE",
        responseHandler: async (response) => {
          const text = await response.text();
          return text ? JSON.parse(text) : null;
        }
      }),
      invalidatesTags: (_result, _error, { companyId, memberId }) => [
        { type: "CompanyMember", id: `COMPANY-${companyId}` },
        { type: "CompanyMember", id: memberId }
      ]
    })
  })
});

export const {
  useListCompanyMembersQuery,
  useAddCompanyMemberMutation,
  useUpdateCompanyMemberRoleMutation,
  useDeactivateCompanyMemberMutation,
  useRemoveCompanyMemberMutation
} = companyMembersApi;
