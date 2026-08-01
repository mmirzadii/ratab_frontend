import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type CompanyGroup = components["schemas"]["CompanyGroup"];
export type CompanyGroupCreateRequest = components["schemas"]["CompanyGroupCreateRequest"];
export type CompanyGroupCreateResult = components["schemas"]["CompanyGroupCreateResult"];
export type CompanyGroupMembership = components["schemas"]["CompanyGroupMembership"];
export type CompanyGroupMemberAddRequest = components["schemas"]["CompanyGroupMemberAddRequest"];
export type PaginatedCompanyGroupList = components["schemas"]["PaginatedCompanyGroupList"];
export type PaginatedCompanyGroupMembershipList =
  components["schemas"]["PaginatedCompanyGroupMembershipList"];
export type PatchedCompanyGroupRequest = components["schemas"]["PatchedCompanyGroupRequest"];
type PatchedProjectRequest = components["schemas"]["PatchedProjectRequest"];
/** Group PATCH may carry linked project fields (handoff); OpenAPI schema lists name/description only. */
export type CompanyGroupSettingsUpdateRequest = PatchedCompanyGroupRequest &
  Partial<
    Pick<
      PatchedProjectRequest,
      | "project_code"
      | "contract_number"
      | "employer_name"
      | "consultant_name"
      | "contractor_name"
      | "executive_agency_name"
      | "base_year"
      | "status"
      | "starts_on"
      | "ends_on"
      | "include_all_company_members_in_group"
    >
  >;
export type MembershipActionResponse = components["schemas"]["MembershipActionResponse"];
export type DeletionPreview = components["schemas"]["DeletionPreview"];
export type DeletionConfirmationRequest = {
  confirmation: string;
};

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
      // Preserve backend activity order; do not re-sort client-side beyond public pin.
      providesTags: (result, _error, companyId) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        ...(result?.results ?? []).map((group) => ({
          type: "CompanyGroup" as const,
          id: group.id
        }))
      ]
    }),
    createCompanyGroup: builder.mutation<
      CompanyGroupCreateResult,
      { companyId: number; body: CompanyGroupCreateRequest }
    >({
      query: ({ companyId, body }) => ({
        url: `/api/companies/${companyId}/groups/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyInvitation", id: "LIST" }
      ]
    }),
    updateCompanyGroup: builder.mutation<
      CompanyGroup,
      { companyId: number; groupId: number; body: CompanyGroupSettingsUpdateRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { companyId, groupId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: groupId },
        { type: "Project", id: "LIST" }
      ]
    }),
    retrieveCompanyGroup: builder.query<CompanyGroup, number>({
      query: (groupId) => `/api/company-groups/${groupId}/`,
      providesTags: (_result, _error, groupId) => [{ type: "CompanyGroup", id: groupId }],
      async onQueryStarted(groupId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const companyId = data.company_id;
          if (companyId == null) return;
          dispatch(
            companyGroupsApi.util.updateQueryData(
              "listCompanyGroups",
              companyId,
              (draft) => {
                const index = draft.results.findIndex((item) => item.id === groupId);
                if (index >= 0) {
                  draft.results[index] = { ...draft.results[index], ...data };
                }
              }
            )
          );
        } catch {
          // Detail fetch failures leave the list cache untouched.
        }
      }
    }),
    getCompanyGroupDeletionPreview: builder.query<DeletionPreview, number>({
      query: (groupId) => `/api/company-groups/${groupId}/deletion-preview/`
    }),
    deleteCompanyGroup: builder.mutation<
      void,
      { companyId: number; groupId: number; body: DeletionConfirmationRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/`,
        method: "DELETE",
        body
      }),
      invalidatesTags: (_result, _error, { companyId, groupId }) => [
        { type: "CompanyGroup", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: groupId },
        { type: "CompanyGroup", id: `MEMBERS-${groupId}` },
        { type: "GroupMessage", id: `GROUP-${groupId}` },
        { type: "CompanyInvitation", id: `GROUP-${groupId}` },
        { type: "CompanyInvitation", id: "LIST" },
        { type: "Project", id: "LIST" },
        { type: "FinancialDocument", id: "LIST" }
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
        const tags: Array<{
          type: "CompanyGroup" | "CompanyInvitation" | "Company" | "GroupMessage" | "Auth";
          id?: string | number;
        }> = [
          { type: "CompanyGroup", id: `COMPANY-${companyId}` },
          { type: "CompanyGroup", id: `MEMBERS-${groupId}` },
          { type: "GroupMessage", id: `GROUP-${groupId}` },
          { type: "CompanyInvitation", id: "LIST" },
          { type: "CompanyInvitation", id: `GROUP-${groupId}` }
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
  useRetrieveCompanyGroupQuery,
  useLazyGetCompanyGroupDeletionPreviewQuery,
  useDeleteCompanyGroupMutation,
  useDeactivateCompanyGroupMutation,
  useListCompanyGroupMembersQuery,
  useAddCompanyGroupMemberMutation,
  useDeactivateCompanyGroupMembershipMutation,
  useRemoveCompanyGroupMembershipMutation
} = companyGroupsApi;
