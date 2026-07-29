import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";
import { getListResults } from "../../shared/utils/listResults";

export type CompanyMembershipInvitation = components["schemas"]["CompanyMembershipInvitation"];
export type MembershipActionResponse = components["schemas"]["MembershipActionResponse"];
export type CompanyInvitationCreateRequest = components["schemas"]["CompanyInvitationCreateRequest"];
export type GroupInvitationCreateRequest = components["schemas"]["GroupInvitationCreateRequest"];
export type PaginatedCompanyMembershipInvitationList =
  components["schemas"]["PaginatedCompanyMembershipInvitationList"];

function normalizeInvitationList(data: unknown): PaginatedCompanyMembershipInvitationList {
  const results = getListResults(data as PaginatedCompanyMembershipInvitationList | CompanyMembershipInvitation[]);
  if (data && typeof data === "object" && !Array.isArray(data) && "count" in data) {
    const page = data as PaginatedCompanyMembershipInvitationList;
    return {
      count: page.count,
      next: page.next ?? null,
      previous: page.previous ?? null,
      results
    };
  }
  return {
    count: results.length,
    next: null,
    previous: null,
    results
  };
}

function tagsFromMembershipAction(result: MembershipActionResponse | undefined) {
  const tags: Array<
    | "Auth"
    | {
        type: "CompanyInvitation" | "Company" | "CompanyMember" | "CompanyGroup" | "GroupMessage";
        id?: string | number;
      }
  > = [
    { type: "CompanyInvitation", id: "LIST" },
    { type: "Company", id: "LIST" },
    "Auth"
  ];

  const companyId = result?.company?.id ?? result?.invitation?.company_id ?? result?.company_member?.company_id;
  if (companyId != null) {
    tags.push({ type: "Company", id: companyId });
    tags.push({ type: "CompanyMember", id: `COMPANY-${companyId}` });
    tags.push({ type: "CompanyGroup", id: `COMPANY-${companyId}` });
  }

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

export const companyInvitationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMyCompanyInvitations: builder.query<PaginatedCompanyMembershipInvitationList, void>({
      query: () => "/api/company-invitations/",
      transformResponse: (response: unknown) => normalizeInvitationList(response),
      providesTags: (result) => [
        { type: "CompanyInvitation", id: "LIST" },
        ...(result?.results ?? []).map((invitation) => ({
          type: "CompanyInvitation" as const,
          id: invitation.id
        }))
      ]
    }),
    createCompanyInvitation: builder.mutation<
      MembershipActionResponse,
      { companyId: number; body: CompanyInvitationCreateRequest }
    >({
      query: ({ companyId, body }) => ({
        url: `/api/companies/${companyId}/invitations/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { companyId }) => [
        ...tagsFromMembershipAction(result),
        { type: "CompanyMember", id: `COMPANY-${companyId}` }
      ]
    }),
    createGroupInvitation: builder.mutation<
      MembershipActionResponse,
      { companyId: number; groupId: number; body: GroupInvitationCreateRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/invitations/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { companyId, groupId }) => [
        ...tagsFromMembershipAction(result),
        { type: "CompanyMember", id: `COMPANY-${companyId}` },
        { type: "CompanyGroup", id: `MEMBERS-${groupId}` }
      ]
    }),
    acceptCompanyInvitation: builder.mutation<MembershipActionResponse, number>({
      query: (invitationId) => ({
        url: `/api/company-invitations/${invitationId}/accept/`,
        method: "POST"
      }),
      invalidatesTags: (result) => tagsFromMembershipAction(result)
    }),
    rejectCompanyInvitation: builder.mutation<MembershipActionResponse, number>({
      query: (invitationId) => ({
        url: `/api/company-invitations/${invitationId}/reject/`,
        method: "POST"
      }),
      invalidatesTags: (result, _error, invitationId) => [
        { type: "CompanyInvitation", id: "LIST" },
        { type: "CompanyInvitation", id: invitationId },
        ...tagsFromMembershipAction(result)
      ]
    })
  })
});

export const {
  useListMyCompanyInvitationsQuery,
  useCreateCompanyInvitationMutation,
  useCreateGroupInvitationMutation,
  useAcceptCompanyInvitationMutation,
  useRejectCompanyInvitationMutation
} = companyInvitationsApi;
