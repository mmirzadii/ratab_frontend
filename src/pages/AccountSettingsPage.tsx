import { Loader2, LogOut } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { userInitials } from "../features/account/accountDisplay";
import {
  ACCOUNT_SETTINGS_TAB_LABELS,
  ACCOUNT_SETTINGS_TABS,
  parseAccountSettingsTab,
  type AccountSettingsTab
} from "../features/account/accountSettingsTabs";
import { useGetCurrentUserQuery } from "../features/auth/authApi";
import { performLogout } from "../features/auth/logout";
import { SubscriptionSection } from "../features/subscription/SubscriptionSection";
import {
  formatSubscriptionStatusLabel,
  useGetMessageQuotaQuery,
  useGetSubscriptionQuery
} from "../features/subscription/subscriptionApi";
import { WalletSection } from "../features/wallet/WalletSection";
import { Button } from "../shared/components/Button";
import { StatusBadge } from "../shared/components/StatusBadge";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { Tooltip } from "../shared/components/Tooltip";
import { classNames } from "../shared/utils/classNames";

function SummaryCell({
  label,
  value,
  mono,
  error,
  loading
}: {
  label: string;
  value: string;
  mono?: boolean;
  error?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-3 py-2">
      <p className="text-[11px] text-ui-text-muted">{label}</p>
      {loading ? (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-ui-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          …
        </div>
      ) : (
        <p
          className={classNames(
            "mt-0.5 truncate text-sm font-black",
            error ? "text-rose-300" : "text-ui-text-primary",
            mono ? "font-mono ltr" : ""
          )}
          title={value}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function AccountTab({
  displayUser,
  onLogout
}: {
  displayUser: {
    display_name: string;
    phone_number: string;
    is_active: boolean;
    is_staff: boolean;
  };
  onLogout: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 border-b border-ui-border-subtle py-2 sm:block sm:border-0 sm:py-0">
          <p className="text-xs text-ui-text-muted">نام نمایشی</p>
          <p className="min-w-0 break-words text-sm font-black text-ui-text-primary sm:mt-1">
            {displayUser.display_name}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-ui-border-subtle py-2 sm:block sm:border-0 sm:py-0">
          <p className="text-xs text-ui-text-muted">شماره تلفن</p>
          <p className="font-mono text-sm font-black text-ui-text-primary ltr sm:mt-1">
            {displayUser.phone_number}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-ui-border-subtle py-2 sm:block sm:border-0 sm:py-0">
          <p className="text-xs text-ui-text-muted">وضعیت حساب</p>
          <p className="sm:mt-1">
            <StatusBadge tone={displayUser.is_active ? "emerald" : "amber"}>
              {displayUser.is_active ? "فعال" : "غیرفعال"}
            </StatusBadge>
          </p>
        </div>
        {displayUser.is_staff ? (
          <div className="flex items-center justify-between gap-3 border-b border-ui-border-subtle py-2 sm:block sm:border-0 sm:py-0">
            <p className="text-xs text-ui-text-muted">نقش سیستم</p>
            <p className="sm:mt-1">
              <StatusBadge tone="violet">ادمین سیستم</StatusBadge>
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-ui-border-subtle pt-3">
        <Button className="w-full sm:w-auto" onClick={onLogout} type="button" variant="secondary">
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </Button>
      </div>
    </div>
  );
}

export function AccountSettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseAccountSettingsTab(searchParams.get("tab"));

  const user = useAppSelector((state) => state.auth.user);
  const { data: freshUser, isLoading: isLoadingUser } = useGetCurrentUserQuery();
  const displayUser = freshUser ?? user;

  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription
  } = useGetSubscriptionQuery();
  const { data: quota, error: quotaError, isLoading: isLoadingQuota } = useGetMessageQuotaQuery();

  const planSummary = useMemo(() => {
    if (subscriptionError) return "خطا";
    if (!subscription) return "—";
    return (
      subscription.effective_plan_title_fa ||
      subscription.plan_title_fa ||
      formatSubscriptionStatusLabel(subscription.status)
    );
  }, [subscription, subscriptionError]);

  const quotaSummary = useMemo(() => {
    if (quotaError) return "خطا";
    if (!quota) return "—";
    if (quota.daily_limit == null) return `${quota.used_today} / ∞`;
    return `${quota.used_today} / ${quota.daily_limit}`;
  }, [quota, quotaError]);

  const accountStatus = displayUser ? (displayUser.is_active ? "فعال" : "غیرفعال") : "—";

  function setTab(tab: AccountSettingsTab) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("tab", tab);
        return next;
      },
      { replace: false }
    );
  }

  async function handleLogout() {
    await performLogout(dispatch);
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1240px] flex-col gap-3 px-3 py-3 sm:gap-3.5 sm:px-6 sm:py-4 lg:px-8">
      <header className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div
          aria-hidden={!displayUser}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ui-primary/30 bg-ui-primary-soft text-sm font-black text-ui-primary"
          title={displayUser?.display_name || "حساب کاربری"}
        >
          {isLoadingUser && !displayUser ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            userInitials(displayUser?.display_name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black text-ui-text-primary sm:text-xl">
            تنظیمات حساب
          </h1>
          {displayUser?.display_name ? (
            <p className="mt-0.5 truncate text-xs text-ui-text-muted">
              {displayUser.display_name}
            </p>
          ) : null}
        </div>

        <Tooltip label="حالت روشن و تاریک">
          <ThemeToggle />
        </Tooltip>
      </header>

      <section aria-label="خلاصه حساب" className="grid shrink-0 grid-cols-3 gap-2">
        <SummaryCell
          error={Boolean(subscriptionError)}
          label="اشتراک مؤثر"
          loading={isLoadingSubscription && !subscription && !subscriptionError}
          value={planSummary}
        />
        <SummaryCell
          error={Boolean(quotaError)}
          label="پیام امروز"
          loading={isLoadingQuota && !quota && !quotaError}
          mono
          value={quotaSummary}
        />
        <SummaryCell
          label="وضعیت حساب"
          loading={isLoadingUser && !displayUser}
          value={accountStatus}
        />
      </section>

      <div className="shrink-0 overflow-x-auto [scrollbar-width:none]">
        <nav
          aria-label="بخش‌های تنظیمات"
          className="flex min-w-max gap-1 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-1"
          role="tablist"
        >
          {ACCOUNT_SETTINGS_TABS.map((tab) => {
            const selected = tab === activeTab;
            return (
              <button
                aria-selected={selected}
                className={classNames(
                  "min-w-[5.5rem] flex-1 rounded-lg px-3 py-2 text-sm font-bold transition sm:min-w-0",
                  selected
                    ? "bg-ui-primary-soft text-ui-primary"
                    : "text-ui-text-muted hover:bg-ui-surface-subtle hover:text-ui-text-primary"
                )}
                key={tab}
                onClick={() => setTab(tab)}
                role="tab"
                type="button"
              >
                {ACCOUNT_SETTINGS_TAB_LABELS[tab]}
              </button>
            );
          })}
        </nav>
      </div>

      <section
        aria-label={ACCOUNT_SETTINGS_TAB_LABELS[activeTab]}
        className={classNames(
          "min-h-0 flex-1 rounded-xl border border-ui-border-subtle bg-ui-surface p-3 sm:p-4",
          activeTab === "tokens" ? "flex flex-col overflow-hidden" : "overflow-y-auto [scrollbar-width:thin]"
        )}
        role="tabpanel"
      >
        {activeTab === "account" ? (
          displayUser ? (
            <AccountTab displayUser={displayUser} onLogout={() => void handleLogout()} />
          ) : (
            <div className="flex items-center gap-2 py-4 text-sm text-ui-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت اطلاعات
            </div>
          )
        ) : null}
        {activeTab === "tokens" ? <WalletSection /> : null}
        {activeTab === "subscription" ? <SubscriptionSection /> : null}
      </section>
    </div>
  );
}
