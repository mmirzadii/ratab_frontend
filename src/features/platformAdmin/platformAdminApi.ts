import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

import {
  extractPaginatedResults,
  normalizeCapabilityCatalog,
  normalizeMembership,
  normalizePlatformAdminMe,
  normalizeSupportTicket,
  type Adjustment,
  type AdjustmentCreateBody,
  type AdminCandidate,
  type AdminCreateBody,
  type AdminUpdateBody,
  type CapabilityCatalog,
  type Paginated,
  type PlatformAdminDashboard,
  type PlatformAdminMe,
  type PlatformAdminMembership,
  type ReasonBody,
  type SubscriptionPlanAdmin,
  type SubscriptionPlanAdminRequest,
  type SupportTicket,
  type SupportTicketMessage,
  type TokenPackageAdmin,
  type TokenPackageAdminRequest,
  type TransferRootRequest
} from "./platformAdminTypes";

export type {
  Adjustment,
  AdminCandidate,
  AdminCreateBody,
  CapabilityCatalog,
  PlatformAdminDashboard,
  PlatformAdminMe,
  PlatformAdminMembership,
  SupportTicket,
  SupportTicketMessage,
  TokenPackageAdmin,
  SubscriptionPlanAdmin
};

function pageParams(page?: number, extra?: Record<string, string | number | undefined>) {
  const params: Record<string, string | number> = {};
  if (page && page > 1) params.page = page;
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined && value !== "") params[key] = value;
    }
  }
  return Object.keys(params).length ? params : undefined;
}

export const platformAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformAdminMe: builder.query<PlatformAdminMe, void>({
      query: () => "/api/platform-admin/me/",
      transformResponse: (response: unknown) =>
        normalizePlatformAdminMe(response as Parameters<typeof normalizePlatformAdminMe>[0]),
      providesTags: [{ type: "PlatformAdmin", id: "ME" }]
    }),
    getPlatformAdminDashboard: builder.query<PlatformAdminDashboard, void>({
      query: () => "/api/platform-admin/dashboard/",
      providesTags: [{ type: "PlatformAdmin", id: "DASHBOARD" }]
    }),

    lookupAdminCandidateByPhone: builder.mutation<AdminCandidate, { phone_number: string }>({
      query: (body) => ({
        url: "/api/platform-admin/superuser/admin-candidates/lookup-by-phone/",
        method: "POST",
        body
      })
    }),
    listPlatformAdmins: builder.query<Paginated<PlatformAdminMembership>, { page?: number } | void>({
      query: (arg) => ({
        url: "/api/platform-admin/superuser/admins/",
        params: pageParams(arg?.page)
      }),
      transformResponse: (response: unknown) => {
        const page = extractPaginatedResults<components["schemas"]["PlatformAdminMembership"]>(response);
        return { ...page, results: page.results.map(normalizeMembership) };
      },
      providesTags: (result) => [
        { type: "PlatformAdmin", id: "ADMINS" },
        ...(result?.results.map((item) => ({ type: "PlatformAdmin" as const, id: `ADMIN-${item.id}` })) ?? [])
      ]
    }),
    createPlatformAdmin: builder.mutation<PlatformAdminMembership, AdminCreateBody>({
      query: (body) => ({
        url: "/api/platform-admin/superuser/admins/",
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["PlatformAdminMembership"]) =>
        normalizeMembership(response),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ADMINS" }]
    }),
    getPlatformAdmin: builder.query<PlatformAdminMembership, number>({
      query: (membershipId) => `/api/platform-admin/superuser/admins/${membershipId}/`,
      transformResponse: (response: components["schemas"]["PlatformAdminMembership"]) =>
        normalizeMembership(response),
      providesTags: (_r, _e, id) => [{ type: "PlatformAdmin", id: `ADMIN-${id}` }]
    }),
    updatePlatformAdmin: builder.mutation<
      PlatformAdminMembership,
      { membershipId: number; body: AdminUpdateBody }
    >({
      query: ({ membershipId, body }) => ({
        url: `/api/platform-admin/superuser/admins/${membershipId}/`,
        method: "PATCH",
        body
      }),
      transformResponse: (response: components["schemas"]["PlatformAdminMembership"]) =>
        normalizeMembership(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "ADMINS" },
        { type: "PlatformAdmin", id: `ADMIN-${arg.membershipId}` }
      ]
    }),
    revokePlatformAdmin: builder.mutation<PlatformAdminMembership, { membershipId: number; body: ReasonBody }>({
      query: ({ membershipId, body }) => ({
        url: `/api/platform-admin/superuser/admins/${membershipId}/revoke/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["PlatformAdminMembership"]) =>
        normalizeMembership(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "ADMINS" },
        { type: "PlatformAdmin", id: `ADMIN-${arg.membershipId}` }
      ]
    }),
    reactivatePlatformAdmin: builder.mutation<
      PlatformAdminMembership,
      { membershipId: number; body: AdminUpdateBody }
    >({
      query: ({ membershipId, body }) => ({
        url: `/api/platform-admin/superuser/admins/${membershipId}/reactivate/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["PlatformAdminMembership"]) =>
        normalizeMembership(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "ADMINS" },
        { type: "PlatformAdmin", id: `ADMIN-${arg.membershipId}` }
      ]
    }),
    getPlatformAdminHistory: builder.query<unknown, number>({
      query: (membershipId) => `/api/platform-admin/superuser/admins/${membershipId}/history/`
    }),
    getCapabilityCatalog: builder.query<CapabilityCatalog, void>({
      query: () => "/api/platform-admin/superuser/capability-catalog/",
      transformResponse: (response: unknown) => normalizeCapabilityCatalog(response),
      providesTags: [{ type: "PlatformAdmin", id: "CATALOG" }]
    }),
    transferPlatformSuperuser: builder.mutation<unknown, TransferRootRequest>({
      query: (body) => ({
        url: "/api/platform-admin/superuser/transfer/",
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ME" }, { type: "PlatformAdmin", id: "ADMINS" }]
    }),

    listAdminUsers: builder.query<
      Paginated<components["schemas"]["AppUser"]>,
      { page?: number; search?: string } | void
    >({
      query: (arg) => ({
        url: "/api/platform-admin/users/",
        params: pageParams(arg?.page, { search: arg?.search })
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "USERS" }]
    }),
    getAdminUser: builder.query<components["schemas"]["AppUser"], number>({
      query: (userId) => `/api/platform-admin/users/${userId}/`,
      providesTags: (_r, _e, id) => [{ type: "PlatformAdmin", id: `USER-${id}` }]
    }),
    suspendAdminUser: builder.mutation<unknown, { userId: number; body: ReasonBody }>({
      query: ({ userId, body }) => ({
        url: `/api/platform-admin/users/${userId}/suspend/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "USERS" },
        { type: "PlatformAdmin", id: `USER-${arg.userId}` }
      ]
    }),
    reactivateAdminUser: builder.mutation<unknown, { userId: number; body: ReasonBody }>({
      query: ({ userId, body }) => ({
        url: `/api/platform-admin/users/${userId}/reactivate/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "USERS" },
        { type: "PlatformAdmin", id: `USER-${arg.userId}` }
      ]
    }),
    revokeAdminUserSessions: builder.mutation<unknown, { userId: number; body: ReasonBody }>({
      query: ({ userId, body }) => ({
        url: `/api/platform-admin/users/${userId}/revoke-sessions/`,
        method: "POST",
        body
      })
    }),
    getAdminUserWallet: builder.query<unknown, number>({
      query: (userId) => `/api/platform-admin/users/${userId}/wallet/`
    }),
    getAdminUserSubscriptions: builder.query<unknown, number>({
      query: (userId) => `/api/platform-admin/users/${userId}/subscriptions/`
    }),
    activateAdminUserSubscription: builder.mutation<
      unknown,
      { userId: number; body: Record<string, unknown> }
    >({
      query: ({ userId, body }) => ({
        url: `/api/platform-admin/users/${userId}/subscriptions/activate/`,
        method: "POST",
        body
      })
    }),
    cancelAdminUserSubscription: builder.mutation<unknown, { userId: number; body: ReasonBody }>({
      query: ({ userId, body }) => ({
        url: `/api/platform-admin/users/${userId}/subscriptions/cancel/`,
        method: "POST",
        body
      })
    }),

    listAdminCompanies: builder.query<
      Paginated<components["schemas"]["Company"]>,
      { page?: number; search?: string } | void
    >({
      query: (arg) => ({
        url: "/api/platform-admin/companies/",
        params: pageParams(arg?.page, { search: arg?.search })
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "COMPANIES" }]
    }),
    getAdminCompany: builder.query<components["schemas"]["Company"], number>({
      query: (companyId) => `/api/platform-admin/companies/${companyId}/`,
      providesTags: (_r, _e, id) => [{ type: "PlatformAdmin", id: `COMPANY-${id}` }]
    }),
    suspendAdminCompany: builder.mutation<unknown, { companyId: number; body: ReasonBody }>({
      query: ({ companyId, body }) => ({
        url: `/api/platform-admin/companies/${companyId}/suspend/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "COMPANIES" }]
    }),
    restoreAdminCompany: builder.mutation<unknown, { companyId: number; body: ReasonBody }>({
      query: ({ companyId, body }) => ({
        url: `/api/platform-admin/companies/${companyId}/restore/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "COMPANIES" }]
    }),
    transferAdminCompanyOwnership: builder.mutation<
      unknown,
      { companyId: number; body: ReasonBody & { target_member_id: number } }
    >({
      query: ({ companyId, body }) => ({
        url: `/api/platform-admin/companies/${companyId}/transfer-ownership/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "COMPANIES" }]
    }),

    listAdminTokenPackages: builder.query<Paginated<TokenPackageAdmin>, { page?: number } | void>({
      query: (arg) => ({
        url: "/api/platform-admin/token-packages/",
        params: pageParams(arg?.page)
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "PACKAGES" }]
    }),
    createAdminTokenPackage: builder.mutation<TokenPackageAdmin, TokenPackageAdminRequest>({
      query: (body) => ({
        url: "/api/platform-admin/token-packages/",
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "PACKAGES" }]
    }),
    updateAdminTokenPackage: builder.mutation<
      TokenPackageAdmin,
      { packageId: number; body: Partial<TokenPackageAdminRequest> }
    >({
      query: ({ packageId, body }) => ({
        url: `/api/platform-admin/token-packages/${packageId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "PACKAGES" }]
    }),
    archiveAdminTokenPackage: builder.mutation<unknown, { packageId: number; body: ReasonBody }>({
      query: ({ packageId, body }) => ({
        url: `/api/platform-admin/token-packages/${packageId}/archive/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "PACKAGES" }]
    }),

    listAdminSubscriptionPlans: builder.query<Paginated<SubscriptionPlanAdmin>, { page?: number } | void>({
      query: (arg) => ({
        url: "/api/platform-admin/subscription-plans/",
        params: pageParams(arg?.page)
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "PLANS" }]
    }),
    createAdminSubscriptionPlan: builder.mutation<SubscriptionPlanAdmin, SubscriptionPlanAdminRequest>({
      query: (body) => ({
        url: "/api/platform-admin/subscription-plans/",
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "PLANS" }]
    }),
    updateAdminSubscriptionPlan: builder.mutation<
      SubscriptionPlanAdmin,
      { planId: number; body: Partial<SubscriptionPlanAdminRequest> }
    >({
      query: ({ planId, body }) => ({
        url: `/api/platform-admin/subscription-plans/${planId}/`,
        method: "PATCH",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "PLANS" }]
    }),
    archiveAdminSubscriptionPlan: builder.mutation<unknown, { planId: number; body: ReasonBody }>({
      query: ({ planId, body }) => ({
        url: `/api/platform-admin/subscription-plans/${planId}/archive/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "PLANS" }]
    }),

    listAdminPaymentOrders: builder.query<
      Paginated<components["schemas"]["PaymentOrder"]>,
      { page?: number } | void
    >({
      query: (arg) => ({
        url: "/api/platform-admin/payment-orders/",
        params: pageParams(arg?.page)
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "ORDERS" }]
    }),
    getAdminPaymentOrder: builder.query<components["schemas"]["PaymentOrder"], number>({
      query: (orderId) => `/api/platform-admin/payment-orders/${orderId}/`
    }),
    cancelAdminPaymentOrder: builder.mutation<unknown, { orderId: number; body: ReasonBody }>({
      query: ({ orderId, body }) => ({
        url: `/api/platform-admin/payment-orders/${orderId}/cancel/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ORDERS" }]
    }),
    retryAdminPaymentOrderVerification: builder.mutation<unknown, { orderId: number; body: ReasonBody }>({
      query: ({ orderId, body }) => ({
        url: `/api/platform-admin/payment-orders/${orderId}/retry-verification/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ORDERS" }]
    }),
    listAdminWalletTransactions: builder.query<Paginated<unknown>, { page?: number } | void>({
      query: (arg) => ({
        url: "/api/platform-admin/wallet-transactions/",
        params: pageParams(arg?.page)
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response)
    }),

    listAdminAdjustments: builder.query<Paginated<Adjustment>, { page?: number } | void>({
      query: (arg) => ({
        url: "/api/platform-admin/financial-adjustments/",
        params: pageParams(arg?.page)
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "ADJUSTMENTS" }]
    }),
    createAdminAdjustment: builder.mutation<Adjustment, AdjustmentCreateBody>({
      query: (body) => ({
        url: "/api/platform-admin/financial-adjustments/",
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ADJUSTMENTS" }]
    }),
    getAdminAdjustment: builder.query<Adjustment, number>({
      query: (adjustmentId) => `/api/platform-admin/financial-adjustments/${adjustmentId}/`
    }),
    approveAdminAdjustment: builder.mutation<
      Adjustment,
      { adjustmentId: number; body: ReasonBody & { break_glass?: boolean } }
    >({
      query: ({ adjustmentId, body }) => ({
        url: `/api/platform-admin/financial-adjustments/${adjustmentId}/approve/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ADJUSTMENTS" }]
    }),
    rejectAdminAdjustment: builder.mutation<Adjustment, { adjustmentId: number; body: ReasonBody }>({
      query: ({ adjustmentId, body }) => ({
        url: `/api/platform-admin/financial-adjustments/${adjustmentId}/reject/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ADJUSTMENTS" }]
    }),
    applyAdminAdjustment: builder.mutation<Adjustment, { adjustmentId: number; body: ReasonBody }>({
      query: ({ adjustmentId, body }) => ({
        url: `/api/platform-admin/financial-adjustments/${adjustmentId}/apply/`,
        method: "POST",
        body
      }),
      invalidatesTags: [{ type: "PlatformAdmin", id: "ADJUSTMENTS" }]
    }),

    listAdminSupportTickets: builder.query<
      Paginated<SupportTicket>,
      { page?: number; status?: string; priority?: string; search?: string } | void
    >({
      query: (arg) => ({
        url: "/api/platform-admin/support/tickets/",
        params: pageParams(arg?.page, {
          status: arg?.status,
          priority: arg?.priority,
          search: arg?.search
        })
      }),
      transformResponse: (response: unknown) => {
        const page = extractPaginatedResults<components["schemas"]["SupportTicket"]>(response);
        return { ...page, results: page.results.map(normalizeSupportTicket) };
      },
      providesTags: [{ type: "PlatformAdmin", id: "TICKETS" }]
    }),
    getAdminSupportTicket: builder.query<SupportTicket, number>({
      query: (ticketId) => `/api/platform-admin/support/tickets/${ticketId}/`,
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      providesTags: (_r, _e, id) => [{ type: "PlatformAdmin", id: `TICKET-${id}` }]
    }),
    replyAdminSupportTicket: builder.mutation<
      SupportTicketMessage,
      { ticketId: number; body: { body: string } }
    >({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/reply/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "TICKETS" },
        { type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }
      ]
    }),
    noteAdminSupportTicket: builder.mutation<
      SupportTicketMessage,
      { ticketId: number; body: { body: string } }
    >({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/internal-notes/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }]
    }),
    assignAdminSupportTicket: builder.mutation<
      SupportTicket,
      { ticketId: number; body: { membership_id?: number | null; reason?: string } }
    >({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/assign/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [{ type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }]
    }),
    changeAdminSupportTicketPriority: builder.mutation<
      SupportTicket,
      { ticketId: number; body: { priority: string; reason?: string } }
    >({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/change-priority/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [{ type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }]
    }),
    resolveAdminSupportTicket: builder.mutation<SupportTicket, { ticketId: number; body: ReasonBody }>({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/resolve/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "TICKETS" },
        { type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }
      ]
    }),
    closeAdminSupportTicket: builder.mutation<SupportTicket, { ticketId: number; body: ReasonBody }>({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/close/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "TICKETS" },
        { type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }
      ]
    }),
    reopenAdminSupportTicket: builder.mutation<SupportTicket, { ticketId: number; body: ReasonBody }>({
      query: ({ ticketId, body }) => ({
        url: `/api/platform-admin/support/tickets/${ticketId}/reopen/`,
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PlatformAdmin", id: "TICKETS" },
        { type: "PlatformAdmin", id: `TICKET-${arg.ticketId}` }
      ]
    }),

    listAdminAuditEvents: builder.query<Paginated<unknown>, { page?: number; action?: string } | void>({
      query: (arg) => ({
        url: "/api/platform-admin/audit-events/",
        params: pageParams(arg?.page, { action: arg?.action })
      }),
      transformResponse: (response: unknown) => extractPaginatedResults(response),
      providesTags: [{ type: "PlatformAdmin", id: "AUDIT" }]
    }),
    getAdminOperationsHealth: builder.query<unknown, void>({
      query: () => "/api/platform-admin/operations/health/"
    }),
    getAdminOperationsPricebooks: builder.query<unknown, void>({
      query: () => "/api/platform-admin/operations/pricebooks/"
    }),
    getAdminOperationsQuotas: builder.query<unknown, void>({
      query: () => "/api/platform-admin/operations/quotas/"
    })
  })
});

export const {
  useGetPlatformAdminMeQuery,
  useGetPlatformAdminDashboardQuery,
  useLookupAdminCandidateByPhoneMutation,
  useListPlatformAdminsQuery,
  useCreatePlatformAdminMutation,
  useGetPlatformAdminQuery,
  useUpdatePlatformAdminMutation,
  useRevokePlatformAdminMutation,
  useReactivatePlatformAdminMutation,
  useGetPlatformAdminHistoryQuery,
  useGetCapabilityCatalogQuery,
  useTransferPlatformSuperuserMutation,
  useListAdminUsersQuery,
  useGetAdminUserQuery,
  useSuspendAdminUserMutation,
  useReactivateAdminUserMutation,
  useRevokeAdminUserSessionsMutation,
  useGetAdminUserWalletQuery,
  useGetAdminUserSubscriptionsQuery,
  useActivateAdminUserSubscriptionMutation,
  useCancelAdminUserSubscriptionMutation,
  useListAdminCompaniesQuery,
  useGetAdminCompanyQuery,
  useSuspendAdminCompanyMutation,
  useRestoreAdminCompanyMutation,
  useTransferAdminCompanyOwnershipMutation,
  useListAdminTokenPackagesQuery,
  useCreateAdminTokenPackageMutation,
  useUpdateAdminTokenPackageMutation,
  useArchiveAdminTokenPackageMutation,
  useListAdminSubscriptionPlansQuery,
  useCreateAdminSubscriptionPlanMutation,
  useUpdateAdminSubscriptionPlanMutation,
  useArchiveAdminSubscriptionPlanMutation,
  useListAdminPaymentOrdersQuery,
  useGetAdminPaymentOrderQuery,
  useCancelAdminPaymentOrderMutation,
  useRetryAdminPaymentOrderVerificationMutation,
  useListAdminWalletTransactionsQuery,
  useListAdminAdjustmentsQuery,
  useCreateAdminAdjustmentMutation,
  useGetAdminAdjustmentQuery,
  useApproveAdminAdjustmentMutation,
  useRejectAdminAdjustmentMutation,
  useApplyAdminAdjustmentMutation,
  useListAdminSupportTicketsQuery,
  useGetAdminSupportTicketQuery,
  useReplyAdminSupportTicketMutation,
  useNoteAdminSupportTicketMutation,
  useAssignAdminSupportTicketMutation,
  useChangeAdminSupportTicketPriorityMutation,
  useResolveAdminSupportTicketMutation,
  useCloseAdminSupportTicketMutation,
  useReopenAdminSupportTicketMutation,
  useListAdminAuditEventsQuery,
  useGetAdminOperationsHealthQuery,
  useGetAdminOperationsPricebooksQuery,
  useGetAdminOperationsQuotasQuery
} = platformAdminApi;
