import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type CompanyMember = components["schemas"]["CompanyMember"];
export type CompanyMemberAddRequest = components["schemas"]["CompanyMemberAddRequest"];
export type PaginatedCompanyMemberList = components["schemas"]["PaginatedCompanyMemberList"];
export type PatchedCompanyMemberRoleRequest = components["schemas"]["PatchedCompanyMemberRoleRequest"];
export type PatchedCompanyMemberSettingsRequest =
  components["schemas"]["PatchedCompanyMemberSettingsRequest"];
export type RoleEnum = components["schemas"]["RoleEnum"];
export type MembershipActionResponse = components["schemas"]["MembershipActionResponse"];

const memberCacheTags = (companyId: number, memberId: number) =>
  [
    { type: "CompanyMember" as const, id: `COMPANY-${companyId}` },
    { type: "CompanyMember" as const, id: memberId },
    { type: "Company" as const, id: companyId },
    { type: "Company" as const, id: "LIST" },
    { type: "CompanyInvitation" as const, id: "LIST" },
    "Auth" as const
  ];

export type ListCompanyMembersArg =
  | number
  | {
      companyId: number;
      activeOnly?: boolean;
      q?: string;
    };

function resolveListCompanyMembersArg(arg: ListCompanyMembersArg): {
  companyId: number;
  activeOnly?: boolean;
  q?: string;
} {
  if (typeof arg === "number") {
    return { companyId: arg };
  }
  return arg;
}

export const companyMembersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyMembers: builder.query<PaginatedCompanyMemberList, ListCompanyMembersArg>({
      query: (arg) => {
        const { companyId, activeOnly, q } = resolveListCompanyMembersArg(arg);
        const params = new URLSearchParams();
        if (activeOnly) params.set("active_only", "true");
        const trimmed = q?.trim();
        if (trimmed) params.set("q", trimmed);
        const qs = params.toString();
        return `/api/companies/${companyId}/members/${qs ? `?${qs}` : ""}`;
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const { companyId, activeOnly, q } = resolveListCompanyMembersArg(queryArgs);
        return `${companyId}|${activeOnly ? 1 : 0}|${(q ?? "").trim()}`;
      },
      providesTags: (result, _error, arg) => {
        const { companyId } = resolveListCompanyMembersArg(arg);
        return [
          { type: "CompanyMember", id: `COMPANY-${companyId}` },
          ...(result?.results ?? []).map((member) => ({
            type: "CompanyMember" as const,
            id: member.id
          }))
        ];
      }
    }),
    /** Full member settings detail — prefer settings endpoint over compact list rows. */
    retrieveCompanyMember: builder.query<CompanyMember, { companyId: number; memberId: number }>({
      query: ({ memberId }) => `/api/company-members/${memberId}/settings/`,
      providesTags: (_result, _error, { memberId, companyId }) => [
        { type: "CompanyMember", id: memberId },
        { type: "CompanyMember", id: `COMPANY-${companyId}` }
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
    /** Atomic role + permission switches. */
    updateCompanyMemberSettings: builder.mutation<
      CompanyMember,
      { companyId: number; memberId: number; body: PatchedCompanyMemberSettingsRequest }
    >({
      query: ({ memberId, body }) => ({
        url: `/api/company-members/${memberId}/settings/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { companyId, memberId }) => memberCacheTags(companyId, memberId)
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
      invalidatesTags: (_result, _error, { companyId, memberId }) => memberCacheTags(companyId, memberId)
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
  useRetrieveCompanyMemberQuery,
  useAddCompanyMemberMutation,
  useUpdateCompanyMemberSettingsMutation,
  useUpdateCompanyMemberRoleMutation,
  useDeactivateCompanyMemberMutation,
  useRemoveCompanyMemberMutation
} = companyMembersApi;
