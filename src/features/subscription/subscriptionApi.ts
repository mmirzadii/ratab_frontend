import { baseApi } from "../../shared/api/baseApi";
import type { components } from "../../shared/api/generated/schema";

export type UserSubscriptionStatus = components["schemas"]["UserSubscriptionStatus"];
export type SubscriptionPlan = components["schemas"]["SubscriptionPlan"];
export type MessageQuotaStatus = components["schemas"]["MessageQuotaStatus"];
export type PaymentOrder = components["schemas"]["PaymentOrder"];
export type PaymentOrderCreateRequest = components["schemas"]["PaymentOrderCreateRequest"];
export type PaymentsDisabled = components["schemas"]["PaymentsDisabled"];

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscription: builder.query<UserSubscriptionStatus, void>({
      query: () => "/api/subscription/",
      providesTags: [{ type: "Subscription", id: "CURRENT" }]
    }),
    listSubscriptionPlans: builder.query<SubscriptionPlan[], void>({
      query: () => "/api/subscription-plans/",
      providesTags: [{ type: "Subscription", id: "PLANS" }]
    }),
    getMessageQuota: builder.query<MessageQuotaStatus, void>({
      query: () => "/api/message-quota/",
      providesTags: [{ type: "MessageQuota", id: "STATUS" }]
    }),
    createPaymentOrder: builder.mutation<PaymentOrder, PaymentOrderCreateRequest>({
      query: (body) => ({
        url: "/api/payments/orders/",
        method: "POST",
        body
      })
    })
  })
});

export const {
  useGetSubscriptionQuery,
  useListSubscriptionPlansQuery,
  useGetMessageQuotaQuery,
  useCreatePaymentOrderMutation
} = subscriptionApi;

export function isPaymentsDisabled(
  error: unknown
): error is { status: 503; data: PaymentsDisabled } {
  if (typeof error !== "object" || !error || !("status" in error) || !("data" in error)) {
    return false;
  }
  const status = (error as { status?: unknown }).status;
  const data = (error as { data?: unknown }).data;
  if (status !== 503 || typeof data !== "object" || !data || !("code" in data)) {
    return false;
  }
  return (data as { code?: unknown }).code === "PAYMENTS_DISABLED";
}

export function formatPaymentsDisabledMessage(data?: PaymentsDisabled | null): string {
  return (
    data?.detail?.trim() ||
    "پرداخت آنلاین در حال حاضر فعال نیست."
  );
}

export function formatQuotaUsageLabel(quota: MessageQuotaStatus): string {
  if (quota.daily_limit == null) {
    return `امروز ${quota.used_today} پیام ارسال شده (بدون سقف روزانه)`;
  }
  const remaining =
    quota.remaining != null ? quota.remaining : Math.max(0, quota.daily_limit - quota.used_today);
  return `امروز ${quota.used_today} از ${quota.daily_limit} پیام — باقی‌مانده: ${remaining}`;
}

export function formatQuotaResetsAt(resetsAt: string | undefined): string | null {
  if (!resetsAt) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(resetsAt));
  } catch {
    return resetsAt;
  }
}

export function formatSubscriptionStatusLabel(status: string | null | undefined): string {
  const value = (status ?? "").trim().toLowerCase();
  if (value === "active") return "فعال";
  if (value === "expired") return "منقضی";
  if (value === "cancelled" || value === "canceled") return "لغوشده";
  if (value === "none" || value === "inactive" || value === "") return "بدون اشتراک";
  return status ?? "نامشخص";
}
