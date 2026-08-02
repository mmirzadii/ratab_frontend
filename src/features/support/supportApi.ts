import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";
import {
  extractPaginatedResults,
  normalizeSupportTicket,
  type Paginated,
  type SupportTicket,
  type SupportTicketMessage
} from "../platformAdmin/platformAdminTypes";

export type SupportTicketCreateRequest = components["schemas"]["SupportTicketCreateRequest"];

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMySupportTickets: builder.query<Paginated<SupportTicket>, { page?: number } | void>({
      query: (arg) => ({
        url: "/api/support/tickets/",
        params: arg?.page && arg.page > 1 ? { page: arg.page } : undefined
      }),
      transformResponse: (response: unknown) => {
        const page = extractPaginatedResults<components["schemas"]["SupportTicket"]>(response);
        return { ...page, results: page.results.map(normalizeSupportTicket) };
      },
      providesTags: [{ type: "SupportTicket", id: "LIST" }]
    }),
    createMySupportTicket: builder.mutation<SupportTicket, SupportTicketCreateRequest>({
      query: (body) => ({
        url: "/api/support/tickets/",
        method: "POST",
        body
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: [{ type: "SupportTicket", id: "LIST" }]
    }),
    getMySupportTicket: builder.query<SupportTicket, number>({
      query: (ticketId) => `/api/support/tickets/${ticketId}/`,
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      providesTags: (_r, _e, id) => [{ type: "SupportTicket", id: `TICKET-${id}` }]
    }),
    replyMySupportTicket: builder.mutation<
      SupportTicketMessage,
      { ticketId: number; body: { body: string } }
    >({
      query: ({ ticketId, body }) => ({
        url: `/api/support/tickets/${ticketId}/messages/`,
        method: "POST",
        body
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SupportTicket", id: "LIST" },
        { type: "SupportTicket", id: `TICKET-${arg.ticketId}` }
      ]
    }),
    closeMySupportTicket: builder.mutation<SupportTicket, { ticketId: number; body?: { reason?: string } }>({
      query: ({ ticketId, body }) => ({
        url: `/api/support/tickets/${ticketId}/close/`,
        method: "POST",
        body: body ?? { reason: "closed by user" }
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SupportTicket", id: "LIST" },
        { type: "SupportTicket", id: `TICKET-${arg.ticketId}` }
      ]
    }),
    reopenMySupportTicket: builder.mutation<SupportTicket, { ticketId: number; body?: { reason?: string } }>({
      query: ({ ticketId, body }) => ({
        url: `/api/support/tickets/${ticketId}/reopen/`,
        method: "POST",
        body: body ?? { reason: "reopened by user" }
      }),
      transformResponse: (response: components["schemas"]["SupportTicket"]) =>
        normalizeSupportTicket(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SupportTicket", id: "LIST" },
        { type: "SupportTicket", id: `TICKET-${arg.ticketId}` }
      ]
    }),
    getSupportUnreadCount: builder.query<{ unread_count?: number; count?: number }, void>({
      query: () => "/api/support/unread-count/",
      providesTags: [{ type: "SupportTicket", id: "UNREAD" }]
    })
  })
});

export const {
  useListMySupportTicketsQuery,
  useCreateMySupportTicketMutation,
  useGetMySupportTicketQuery,
  useReplyMySupportTicketMutation,
  useCloseMySupportTicketMutation,
  useReopenMySupportTicketMutation,
  useGetSupportUnreadCountQuery
} = supportApi;
