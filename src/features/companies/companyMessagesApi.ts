import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type GroupMessage = components["schemas"]["GroupMessage"];
export type GroupMessageCreateRequest = components["schemas"]["GroupMessageCreateRequest"];
export type GroupMessageForwardRequest = components["schemas"]["GroupMessageForwardRequest"];
export type ForwardedFrom = components["schemas"]["ForwardedFrom"];
export type PaginatedGroupMessage = components["schemas"]["PaginatedGroupMessage"];
export type MessageQuotaExceeded = components["schemas"]["MessageQuotaExceeded"];
export type MessageAttachment = components["schemas"]["MessageAttachment"];

/** Contract page size from FRONTEND_HANDOFF (`?page=`, size 50). */
export const GROUP_MESSAGE_PAGE_SIZE = 50;

export const companyMessagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listGroupMessages: builder.query<
      PaginatedGroupMessage,
      { groupId: number; page?: number }
    >({
      query: ({ groupId, page }) => ({
        url: `/api/company-groups/${groupId}/messages/`,
        // OpenAPI omits `page` on this operation; handoff requires page-number pagination.
        params: page != null && page > 1 ? { page } : undefined
      }),
      providesTags: (_result, _error, { groupId, page }) => [
        { type: "GroupMessage", id: `GROUP-${groupId}` },
        { type: "GroupMessage", id: `GROUP-${groupId}-PAGE-${page ?? 1}` }
      ]
    }),
    createGroupMessage: builder.mutation<
      GroupMessage,
      { groupId: number; companyId: number; body: GroupMessageCreateRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/messages/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, error, { groupId, companyId }) => {
        const tags: Array<{ type: "GroupMessage" | "MessageQuota" | "CompanyGroup"; id: string | number }> = [
          { type: "GroupMessage", id: `GROUP-${groupId}` }
        ];
        // Only successful sends reorder the conversation list (backend last_activity_at).
        if (!error && result) {
          tags.push({ type: "MessageQuota", id: "STATUS" });
          tags.push({ type: "CompanyGroup", id: `COMPANY-${companyId}` });
          tags.push({ type: "CompanyGroup", id: groupId });
        }
        return tags;
      }
    }),
    updateGroupMessage: builder.mutation<
      GroupMessage,
      { messageId: number; groupId: number; body: { text: string } }
    >({
      query: ({ messageId, body }) => ({
        url: `/api/group-messages/${messageId}/`,
        method: "PATCH",
        body
      }),
      // Edit does not consume quota and does not bump group activity.
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "GroupMessage", id: `GROUP-${groupId}` }
      ]
    }),
    deleteGroupMessage: builder.mutation<
      GroupMessage,
      { messageId: number; groupId: number }
    >({
      query: ({ messageId }) => ({
        url: `/api/group-messages/${messageId}/`,
        method: "DELETE"
      }),
      // Soft-delete does not consume quota and does not bump group activity.
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "GroupMessage", id: `GROUP-${groupId}` }
      ]
    }),
    forwardGroupMessage: builder.mutation<
      GroupMessage,
      {
        messageId: number;
        companyId: number;
        sourceGroupId: number;
        body: GroupMessageForwardRequest;
      }
    >({
      query: ({ messageId, body }) => ({
        url: `/api/group-messages/${messageId}/forward/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, error, { companyId, body }) => {
        const tags: Array<{ type: "GroupMessage" | "MessageQuota" | "CompanyGroup"; id: string | number }> =
          [];
        // Forward creates a new message in the target group and consumes quota.
        if (!error && result) {
          tags.push({ type: "GroupMessage", id: `GROUP-${body.target_group_id}` });
          tags.push({ type: "MessageQuota", id: "STATUS" });
          tags.push({ type: "CompanyGroup", id: `COMPANY-${companyId}` });
          tags.push({ type: "CompanyGroup", id: body.target_group_id });
        }
        return tags;
      }
    })
  })
});

export const {
  useListGroupMessagesQuery,
  useLazyListGroupMessagesQuery,
  useCreateGroupMessageMutation,
  useUpdateGroupMessageMutation,
  useDeleteGroupMessageMutation,
  useForwardGroupMessageMutation
} = companyMessagesApi;

export function isMessageQuotaExceeded(error: unknown): error is {
  status: 429;
  data: MessageQuotaExceeded;
} {
  if (typeof error !== "object" || !error || !("status" in error) || !("data" in error)) {
    return false;
  }
  const status = (error as { status?: unknown }).status;
  const data = (error as { data?: unknown }).data;
  if (status !== 429 || typeof data !== "object" || !data || !("code" in data)) {
    return false;
  }
  return (data as { code?: unknown }).code === "MESSAGE_QUOTA_EXCEEDED";
}

export function formatQuotaResetHint(
  resetsAt: string | undefined,
  details?: { usedToday?: string; dailyLimit?: string }
): string {
  const usage =
    details?.usedToday != null && details?.dailyLimit != null
      ? ` (استفاده‌شده امروز: ${details.usedToday} از ${details.dailyLimit})`
      : "";
  if (!resetsAt) {
    return `سقف روزانه پیام پر شده است${usage}. بعداً دوباره تلاش کنید.`;
  }
  try {
    const formatted = new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(resetsAt));
    return `سقف روزانه پیام پر شده است${usage}. زمان بازنشانی: ${formatted}`;
  } catch {
    return `سقف روزانه پیام پر شده است${usage}. زمان بازنشانی: ${resetsAt}`;
  }
}

export { createClientMessageId, getForwardedLabel } from "./chatMessageHelpers";
