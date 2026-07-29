import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type CompanyMember = components["schemas"]["CompanyMember"];
export type CompanyMemberAddRequest = components["schemas"]["CompanyMemberAddRequest"];
export type PaginatedCompanyMemberList = components["schemas"]["PaginatedCompanyMemberList"];
export type PatchedCompanyMemberRoleRequest = components["schemas"]["PatchedCompanyMemberRoleRequest"];
export type RoleEnum = components["schemas"]["RoleEnum"];
export type MembershipActionResponse = components["schemas"]["MembershipActionResponse"];

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
      MembershipActionResponse,
      { companyId: number; body: CompanyMemberAddRequest }
    >({
      query: ({ companyId, body }) => ({
        url: `/api/companies/${companyId}/members/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { companyId }) => {
        const tags: Array<{
          type: "CompanyMember" | "CompanyInvitation" | "Company" | "CompanyGroup" | "GroupMessage";
          id?: string | number;
        }> = [
          { type: "CompanyMember", id: `COMPANY-${companyId}` },
          { type: "CompanyInvitation", id: "LIST" },
          { type: "Company", id: "LIST" }
        ];
        const groupId =
          result?.group?.id ?? result?.group_membership?.group_id ?? result?.invitation?.target_group_id;
        if (groupId != null) {
          tags.push({ type: "CompanyGroup", id: `MEMBERS-${groupId}` });
          tags.push({ type: "GroupMessage", id: `GROUP-${groupId}` });
        }
        if (result?.invitation?.id != null) {
          tags.push({ type: "CompanyInvitation", id: result.invitation.id });
        }
        return tags;
      }
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
