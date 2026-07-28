import { useState } from "react";
import { Ban, CreditCard, Loader2, MessageSquare, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "../../shared/components/Button";
import { GlassCard } from "../../shared/components/GlassCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { formatMoneyAmount } from "../../shared/utils/formatters";
import {
  formatPaymentsDisabledMessage,
  formatQuotaResetsAt,
  formatQuotaUsageLabel,
  formatSubscriptionStatusLabel,
  isPaymentsDisabled,
  useCreatePaymentOrderMutation,
  useGetMessageQuotaQuery,
  useGetSubscriptionQuery,
  useListSubscriptionPlansQuery,
  type SubscriptionPlan
} from "./subscriptionApi";

/**
 * Documentation example from `backend_docs/current/API_USAGE_EXAMPLES.md` §11.
 * Used only to probe the disabled-payment boundary. Packages are not seeded
 * (KNOWN_LIMITATIONS); this is not a purchasable product code.
 */
const PAYMENT_AVAILABILITY_PROBE_PACKAGE_CODE = "tokens-100";

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
  const [createPaymentOrder, paymentState] = useCreatePaymentOrderMutation();
  const [paymentNotice, setPaymentNotice] = useState<{
    tone: "amber" | "rose";
    message: string;
  } | null>(null);

  const isRefreshing = isFetchingSubscription || isFetchingPlans || isFetchingQuota;

  async function handleCheckPaymentAvailability() {
    setPaymentNotice(null);
    try {
      await createPaymentOrder({
        package_code: PAYMENT_AVAILABILITY_PROBE_PACKAGE_CODE,
        idempotency_key: `payment-probe-${Date.now()}`
      }).unwrap();
      // v1.0 contract: online payment is disabled; a 201 would be unexpected.
      setPaymentNotice({
        tone: "amber",
        message:
          "پاسخ غیرمنتظره از سرویس پرداخت دریافت شد. فعلاً شارژ و اشتراک فقط توسط ادمین فعال می‌شود."
      });
    } catch (error) {
      if (isPaymentsDisabled(error)) {
        setPaymentNotice({
          tone: "amber",
          message: formatPaymentsDisabledMessage(error.data)
        });
        return;
      }
      setPaymentNotice({
        tone: "rose",
        message: getApiErrorMessage(error)
      });
    }
  }

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
              وضعیت اشتراک، سقف روزانه پیام و محدودیت پرداخت آنلاین از بک‌اند خوانده می‌شود.
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
                    ? "نامحدود (یا بدون سقف پیکربندی‌شده)"
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
                  سقف روزانه برای این حساب پیکربندی نشده است؛ استفاده همچنان ثبت می‌شود. عدد سقف را
                  در فرانت اختراع نمی‌کنیم.
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
            طرح‌های اشتراک (بک‌اند)
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
              هنوز طرح اشتراکی از بک‌اند برنگشته است. تعریف طرح‌ها و سقف‌ها تصمیم مالک محصول است و در
              فرانت اختراع نمی‌شود.
            </p>
          )}
          <p className="mt-2 text-xs leading-5 text-slate-500 light:text-slate-500">
            خرید یا فعال‌سازی اشتراک از این صفحه انجام نمی‌شود؛ در نسخه فعلی فقط ادمین اشتراک را
            فعال می‌کند.
          </p>
        </div>

        <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 light:border-amber-200 light:bg-amber-50">
          <div className="flex items-start gap-2">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-amber-200 light:text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-amber-100 light:text-amber-900">
                پرداخت آنلاین غیرفعال است
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-100/90 light:text-amber-800">
                در نسخه فعلی درگاه بانکی متصل نیست. شارژ توکن و فعال‌سازی اشتراک فقط توسط ادمین
                انجام می‌شود. فرانت مبلغ، تعداد توکن، یا وضعیت پرداخت را تعیین نمی‌کند.
              </p>
              <div className="mt-3">
                <Button
                  disabled={paymentState.isLoading}
                  onClick={() => void handleCheckPaymentAvailability()}
                  type="button"
                  variant="secondary"
                >
                  {paymentState.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  بررسی وضعیت پرداخت آنلاین
                </Button>
              </div>
              {paymentNotice ? (
                <p
                  className={classNames(
                    "mt-2 rounded-lg border px-3 py-2 text-xs font-bold leading-5",
                    paymentNotice.tone === "amber"
                      ? "border-amber-300/30 bg-black/10 text-amber-50 light:border-amber-300 light:bg-white/70 light:text-amber-900"
                      : "border-rose-300/30 bg-black/10 text-rose-50 light:border-rose-300 light:bg-white/70 light:text-rose-800"
                  )}
                >
                  {paymentNotice.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
