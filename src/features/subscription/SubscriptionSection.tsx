import { Ban, Loader2, RefreshCw } from "lucide-react";
import { useMemo } from "react";

import {
  formatAttachmentLimitFa,
  formatDailyMessageLimitFa,
  formatPlanPriceFa
} from "../account/accountDisplay";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import {
  formatQuotaResetsAt,
  formatSubscriptionStatusLabel,
  getCurrentPlanCode,
  useGetMessageQuotaQuery,
  useGetSubscriptionQuery,
  useListSubscriptionPlansQuery,
  type SubscriptionPlan,
  type UserSubscriptionStatus
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

function planStateLabel(plan: SubscriptionPlan, isCurrent: boolean): string {
  if (isCurrent) return "فعال";
  if (!plan.is_available) return "به‌زودی";
  if (plan.is_free_fallback) return "رایگان";
  if (plan.can_activate) return "قابل فعال‌سازی";
  return "غیرفعال";
}

function PlanCard({
  isCurrent,
  plan
}: {
  isCurrent: boolean;
  plan: SubscriptionPlan;
}) {
  const state = planStateLabel(plan, isCurrent);
  const free = plan.is_free_fallback || /^0+(?:\.0+)?$/.test(String(plan.price_amount).trim());

  return (
    <li
      className={classNames(
        "flex flex-col rounded-xl border px-3 py-3",
        isCurrent
          ? "border-ui-primary/35 bg-ui-primary-soft"
          : "border-ui-border-subtle bg-ui-surface-subtle"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-ui-text-primary">{plan.title_fa}</p>
        <StatusBadge
          className="!rounded-md !px-2 !py-0.5"
          tone={isCurrent ? "emerald" : !plan.is_available ? "slate" : free ? "amber" : "violet"}
        >
          {state}
        </StatusBadge>
      </div>
      {plan.description_fa ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-ui-text-muted">
          {plan.description_fa}
        </p>
      ) : null}
      <dl className="mt-3 grid gap-1.5 text-xs text-ui-text-muted">
        <div className="flex justify-between gap-2">
          <dt>قیمت</dt>
          <dd className="font-bold text-ui-text-secondary">
            {free ? "رایگان" : formatPlanPriceFa(plan.price_amount, plan.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>مدت</dt>
          <dd className="font-bold text-ui-text-secondary">{plan.duration_days} روز</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>سقف پیام روزانه</dt>
          <dd className="font-bold text-ui-text-secondary">
            {formatDailyMessageLimitFa(plan.daily_message_limit)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>سقف پیوست</dt>
          <dd className="font-bold text-ui-text-secondary">
            {formatAttachmentLimitFa(plan.max_attachment_bytes_per_message)}
          </dd>
        </div>
      </dl>
      {!plan.is_available ? (
        <p className="mt-3 text-center text-[11px] font-bold text-ui-text-muted">
          غیرفعال
        </p>
      ) : isCurrent ? (
        <p className="mt-3 text-center text-[11px] font-bold text-ui-primary">
          پلن فعلی
        </p>
      ) : null}
    </li>
  );
}

function currentPlanTitle(subscription: UserSubscriptionStatus): string {
  return (
    subscription.effective_plan_title_fa ||
    subscription.plan_title_fa ||
    "طرح پایه"
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

  const currentPlanCode = useMemo(
    () => getCurrentPlanCode(subscription, plans),
    [subscription, plans]
  );

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.display_order - b.display_order),
    [plans]
  );

  function handleRefresh() {
    void refetchSubscription();
    void refetchPlans();
    void refetchQuota();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-ui-text-secondary">اشتراک و سهمیه</h3>
        <button
          aria-label="به‌روزرسانی اشتراک و سهمیه"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
          disabled={isRefreshing}
          onClick={handleRefresh}
          type="button"
        >
          <RefreshCw className={classNames("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
        </button>
      </div>

      {subscriptionError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-100">
          <span>دریافت وضعیت اشتراک ناموفق بود.</span>
          <button
            className="rounded-md px-2 py-1 text-xs font-bold underline-offset-2 hover:underline"
            onClick={() => void refetchSubscription()}
            type="button"
          >
            تلاش دوباره
          </button>
        </div>
      ) : subscription ? (
        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-ui-text-muted">طرح مؤثر فعلی</p>
              <p className="mt-1 text-base font-black text-ui-text-primary">
                {currentPlanTitle(subscription)}
              </p>
            </div>
            <StatusBadge
              tone={
                subscription.has_paid_subscription || subscription.is_free_fallback
                  ? "emerald"
                  : "slate"
              }
            >
              {formatSubscriptionStatusLabel(subscription.status)}
            </StatusBadge>
          </div>
          <dl className="mt-3 grid gap-2 text-xs text-ui-text-muted sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt>شروع</dt>
              <dd className="mt-0.5 font-bold text-ui-text-secondary">
                {formatDateTime(subscription.starts_at)}
              </dd>
            </div>
            <div>
              <dt>پایان</dt>
              <dd className="mt-0.5 font-bold text-ui-text-secondary">
                {formatDateTime(subscription.ends_at)}
              </dd>
            </div>
            <div>
              <dt>سقف پیام روزانه</dt>
              <dd className="mt-0.5 font-bold text-ui-text-secondary">
                {formatDailyMessageLimitFa(subscription.effective_daily_message_limit)}
              </dd>
            </div>
            <div>
              <dt>سقف پیوست</dt>
              <dd className="mt-0.5 font-bold text-ui-text-secondary">
                {formatAttachmentLimitFa(subscription.effective_max_attachment_bytes)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-2 text-sm text-ui-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال دریافت وضعیت اشتراک
        </div>
      )}

      {quotaError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          <span>دریافت سهمیه پیام ناموفق بود.</span>
          <button
            className="rounded-md px-2 py-1 text-xs font-bold underline-offset-2 hover:underline"
            onClick={() => void refetchQuota()}
            type="button"
          >
            تلاش دوباره
          </button>
        </div>
      ) : quota ? (
        <p className="text-xs text-ui-text-muted">
          بازنشانی سهمیه: {formatQuotaResetsAt(quota.resets_at) ?? "—"}
          {quota.daily_limit == null ? (
            <span className="mr-2"> — بدون سقف روزانه</span>
          ) : null}
        </p>
      ) : (
        <div className="flex items-center gap-2 py-1 text-sm text-ui-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال دریافت سهمیه پیام
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-bold text-ui-text-muted">طرح‌های اشتراک</h4>
        {plansError ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-100">
            <span>دریافت فهرست طرح‌ها ناموفق بود.</span>
            <button
              className="rounded-md px-2 py-1 text-xs font-bold underline-offset-2 hover:underline"
              onClick={() => void refetchPlans()}
              type="button"
            >
              تلاش دوباره
            </button>
          </div>
        ) : sortedPlans.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPlans.map((plan) => (
              <PlanCard
                isCurrent={Boolean(currentPlanCode) && plan.code === currentPlanCode}
                key={plan.code}
                plan={plan}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-ui-surface-subtle px-3 py-3 text-sm text-ui-text-muted">
            هنوز طرح اشتراکی تعریف نشده است.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-ui-surface-subtle px-3 py-2.5">
        <Ban className="h-4 w-4 shrink-0 text-amber-300" />
        <p className="text-sm text-ui-text-secondary">
          پرداخت آنلاین در حال حاضر فعال نیست.
        </p>
      </div>
    </div>
  );
}
