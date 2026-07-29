import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type CompanyGroup = components["schemas"]["CompanyGroup"];
export type CompanyGroupRequest = components["schemas"]["CompanyGroupRequest"];
export type CompanyGroupMembership = components["schemas"]["CompanyGroupMembership"];
export type CompanyGroupMemberAddRequest = components["schemas"]["CompanyGroupMemberAddRequest"];
export type PaginatedCompanyGroupList = components["schemas"]["PaginatedCompanyGroupList"];
export type PaginatedCompanyGroupMembershipList =
  components["schemas"]["PaginatedCompanyGroupMembershipList"];
export type PatchedCompanyGroupRequest = components["schemas"]["PatchedCompanyGroupRequest"];
export type MembershipActionResponse = components["schemas"]["MembershipActionResponse"];

export const companyGroupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyGroups: builder.query<PaginatedCompanyGroupList, number>({
      query: (companyId) => `/api/companies/${companyId}/groups/`,
      transformResponse: (response: unknown): PaginatedCompanyGroupList => {
        if (Array.isArray(response)) {
          return {
            count: response.length,
            next: null,
            previous: null,
            results: response as CompanyGroup[]
          };
        }
        return response as PaginatedCompanyGroupList;
      },
      providesTags: (result, _error, companyId) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        ...(result?.results ?? []).map((group) => ({
          type: "CompanyGroup" as const,
          id: group.id
        }))
      ]
    }),
    createCompanyGroup: builder.mutation<
      CompanyGroup,
      { companyId: number; body: CompanyGroupRequest }
    >({
      query: ({ companyId, body }) => ({
        url: `/api/companies/${companyId}/groups/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` }
      ]
    }),
    updateCompanyGroup: builder.mutation<
      CompanyGroup,
      { companyId: number; groupId: number; body: PatchedCompanyGroupRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { companyId, groupId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: groupId }
      ]
    }),
    deactivateCompanyGroup: builder.mutation<
      CompanyGroup,
      { companyId: number; groupId: number }
    >({
      query: ({ groupId }) => ({
        url: `/api/company-groups/${groupId}/deactivate/`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { companyId, groupId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: groupId }
      ]
    }),
    listCompanyGroupMembers: builder.query<PaginatedCompanyGroupMembershipList, number>({
      query: (groupId) => `/api/company-groups/${groupId}/members/`,
      providesTags: (result, _error, groupId) => [
        { type: "CompanyGroup", id: `MEMBERS-${groupId}` },
        ...(result?.results ?? []).map((membership) => ({
          type: "CompanyGroup" as const,
          id: `MEMBERSHIP-${membership.id}`
        }))
      ]
    }),
    addCompanyGroupMember: builder.mutation<
      MembershipActionResponse,
      { companyId: number; groupId: number; body: CompanyGroupMemberAddRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/members/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { companyId, groupId }) => {
        const tags: Array<{ type: "CompanyGroup" | "CompanyInvitation" | "Company" | "GroupMessage" | "Auth"; id?: string | number }> = [
          { type: "CompanyGroup", id: `COMPANY-${companyId}` },
          { type: "CompanyGroup", id: `MEMBERS-${groupId}` },
          { type: "GroupMessage", id: `GROUP-${groupId}` },
          { type: "CompanyInvitation", id: "LIST" }
        ];
        if (result?.invitation?.id != null) {
          tags.push({ type: "CompanyInvitation", id: result.invitation.id });
          tags.push({ type: "Company", id: "LIST" });
        }
        return tags;
      }
    }),
    deactivateCompanyGroupMembership: builder.mutation<
      CompanyGroupMembership,
      { companyId: number; groupId: number; membershipId: number }
    >({
      query: ({ membershipId }) => ({
        url: `/api/company-group-memberships/${membershipId}/deactivate/`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { companyId, groupId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: `MEMBERS-${groupId}` }
      ]
    }),
    removeCompanyGroupMembership: builder.mutation<
      null,
      { companyId: number; groupId: number; membershipId: number }
    >({
      query: ({ membershipId }) => ({
        url: `/api/company-group-memberships/${membershipId}/`,
        method: "DELETE",
        responseHandler: async (response) => {
          const text = await response.text();
          return text ? JSON.parse(text) : null;
        }
      }),
      invalidatesTags: (_result, _error, { companyId, groupId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: `MEMBERS-${groupId}` }
      ]
    })
  })
});

export const {
  useListCompanyGroupsQuery,
  useCreateCompanyGroupMutation,
  useUpdateCompanyGroupMutation,
  useDeactivateCompanyGroupMutation,
  useListCompanyGroupMembersQuery,
  useAddCompanyGroupMemberMutation,
  useDeactivateCompanyGroupMembershipMutation,
  useRemoveCompanyGroupMembershipMutation
} = companyGroupsApi;
