import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type GroupMessage = components["schemas"]["GroupMessage"];
export type GroupMessageCreateRequest = components["schemas"]["GroupMessageCreateRequest"];
export type PaginatedGroupMessage = components["schemas"]["PaginatedGroupMessage"];
export type MessageQuotaExceeded = components["schemas"]["MessageQuotaExceeded"];

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
      { groupId: number; body: GroupMessageCreateRequest }
    >({
      query: ({ groupId, body }) => ({
        url: `/api/company-groups/${groupId}/messages/`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, _error, { groupId }) => [
        { type: "GroupMessage", id: `GROUP-${groupId}` },
        ...(result ? ([{ type: "MessageQuota" as const, id: "STATUS" }] as const) : [])
      ]
    })
  })
});

export const { useListGroupMessagesQuery, useLazyListGroupMessagesQuery, useCreateGroupMessageMutation } =
  companyMessagesApi;

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
