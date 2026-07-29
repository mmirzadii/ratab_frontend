import { Ban, Loader2, MessageSquare, RefreshCw, Sparkles } from "lucide-react";

import { GlassCard } from "../../shared/components/GlassCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { formatMoneyAmount } from "../../shared/utils/formatters";
import {
  formatQuotaResetsAt,
  formatQuotaUsageLabel,
  formatSubscriptionStatusLabel,
  useGetMessageQuotaQuery,
  useGetSubscriptionQuery,
  useListSubscriptionPlansQuery,
  type SubscriptionPlan
} from "./subscriptionApi";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function PlanRow({ plan }: { plan: SubscriptionPlan }) {
  return (
    <li className="px-3 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 light:text-slate-900">{plan.title_fa}</p>
          {plan.description_fa ? (
            <p className="mt-0.5 text-xs leading-5 text-slate-400 light:text-slate-500">
              {plan.description_fa}
            </p>
          ) : null}
          <p className="mt-1 font-mono text-[11px] text-slate-500 light:text-slate-400 ltr">
            {plan.code}
          </p>
        </div>
        <div className="text-left text-xs text-slate-300 light:text-slate-600">
          <p className="font-black">
            {plan.daily_message_limit == null
              ? "سقف پیام: نامحدود"
              : `سقف روزانه: ${plan.daily_message_limit}`}
          </p>
          <p className="mt-0.5">مدت: {plan.duration_days} روز</p>
          <p className="mt-0.5 font-mono ltr">
            {formatMoneyAmount(plan.price_amount)} {plan.currency}
          </p>
        </div>
      </div>
    </li>
  );
}

export function SubscriptionSection() {
  const {
    data: subscription,
    error: subscriptionError,
    isFetching: isFetchingSubscription,
    refetch: refetchSubscription
  } = useGetSubscriptionQuery();
  const {
    data: plans = [],
    error: plansError,
    isFetching: isFetchingPlans,
    refetch: refetchPlans
  } = useListSubscriptionPlansQuery();
  const {
    data: quota,
    error: quotaError,
    isFetching: isFetchingQuota,
    refetch: refetchQuota
  } = useGetMessageQuotaQuery();
  const isRefreshing = isFetchingSubscription || isFetchingPlans || isFetchingQuota;

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 light:border-slate-200 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200 sm:h-11 sm:w-11">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white light:text-slate-950 sm:text-lg">
              اشتراک و سهمیه پیام
            </h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              وضعیت اشتراک و سهمیه پیام
            </p>
          </div>
        </div>
        <button
          aria-label="به‌روزرسانی اشتراک و سهمیه"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
          disabled={isRefreshing}
          onClick={() => {
            void refetchSubscription();
            void refetchPlans();
            void refetchQuota();
          }}
          type="button"
        >
          <RefreshCw className={classNames("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
        </button>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        {subscriptionError ? (
          <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-100 light:text-rose-800">
            دریافت وضعیت اشتراک ناموفق بود.
          </p>
        ) : subscription ? (
          <div className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-400 light:text-slate-500">اشتراک فعلی</p>
                <p className="mt-1 text-sm font-black text-white light:text-slate-950">
                  {subscription.has_active_subscription
                    ? subscription.plan_title_fa || subscription.plan_code || "اشتراک فعال"
                    : "بدون اشتراک فعال"}
                </p>
              </div>
              <StatusBadge tone={subscription.has_active_subscription ? "emerald" : "slate"}>
                {formatSubscriptionStatusLabel(subscription.status)}
              </StatusBadge>
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-slate-400 light:text-slate-500 sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:block">
                <dt>شروع</dt>
                <dd className="font-bold text-slate-200 light:text-slate-700">
                  {formatDateTime(subscription.starts_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt>پایان</dt>
                <dd className="font-bold text-slate-200 light:text-slate-700">
                  {formatDateTime(subscription.ends_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:col-span-2 sm:block">
                <dt>سقف مؤثر روزانه پیام</dt>
                <dd className="font-bold text-slate-200 light:text-slate-700">
                  {subscription.effective_daily_message_limit == null
                    ? "بدون سقف روزانه"
                    : `${subscription.effective_daily_message_limit} پیام`}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 text-sm text-slate-400 light:text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت وضعیت اشتراک
          </div>
        )}

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-slate-200 light:text-slate-800">
            <MessageSquare className="h-4 w-4" />
            سهمیه روزانه پیام
          </h3>
          {quotaError ? (
            <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-100 light:text-rose-800">
              دریافت سهمیه پیام ناموفق بود.
            </p>
          ) : quota ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="text-sm font-bold text-slate-100 light:text-slate-900">
                {formatQuotaUsageLabel(quota)}
              </p>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                بازنشانی: {formatQuotaResetsAt(quota.resets_at) ?? "—"}
                {quota.plan_code ? (
                  <span className="mr-2 font-mono ltr"> — {quota.plan_code}</span>
                ) : null}
              </p>
              {quota.daily_limit == null ? (
                <p className="mt-2 text-xs leading-5 text-slate-400 light:text-slate-500">
                  بدون سقف روزانه
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 text-sm text-slate-400 light:text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت سهمیه پیام
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-black text-slate-200 light:text-slate-800">
            طرح‌های اشتراک
          </h3>
          {plansError ? (
            <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-100 light:text-rose-800">
              دریافت فهرست طرح‌ها ناموفق بود.
            </p>
          ) : plans.length > 0 ? (
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 light:divide-slate-200 light:border-slate-200">
              {plans.map((plan) => (
                <PlanRow key={plan.code} plan={plan} />
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500">
              هنوز طرح اشتراکی تعریف نشده است.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 light:border-slate-200 light:bg-slate-50">
          <Ban className="h-4 w-4 shrink-0 text-amber-300 light:text-amber-600" />
          <p className="text-sm text-slate-300 light:text-slate-600">
            پرداخت آنلاین در حال حاضر فعال نیست.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
