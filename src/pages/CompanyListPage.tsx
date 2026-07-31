import {
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  XCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearCreateCompanyHighlight } from "../features/auth/authSlice";
import { useListCompaniesQuery } from "../features/companies/companyApi";
import { useListMyCompanyInvitationsQuery } from "../features/companies/companyInvitationsApi";
import { PendingInvitationsSection } from "../features/companies/PendingInvitationsSection";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { classNames } from "../shared/utils/classNames";
import { getListResults } from "../shared/utils/listResults";

export function CompanyListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((state) => state.auth.status);
  const shouldHighlightCreateCompany = useAppSelector(
    (state) => state.auth.shouldHighlightCreateCompany
  );
  const sessionReady = authStatus === "authenticated";
  const { data, error, isFetching, isLoading, refetch } = useListCompaniesQuery(undefined, {
    skip: !sessionReady
  });
  const { data: invitationsData } = useListMyCompanyInvitationsQuery(undefined, {
    skip: !sessionReady
  });

  const companies = data?.results ?? [];
  const companyCount = data?.count ?? companies.length;
  const pendingInvitationCount = getListResults(invitationsData).filter(
    (item) => item.status === "pending"
  ).length;

  function goToCreate() {
    dispatch(clearCreateCompanyHighlight());
    navigate("/companies/new");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-2.5 px-3 pb-6 pt-2 sm:gap-5 sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
      <GlassCard className="relative overflow-hidden p-3 sm:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2 sm:space-y-3">
            <div className="hidden sm:block">
              <StatusBadge tone="emerald">
                <Sparkles className="h-3.5 w-3.5" />
                فضای شرکت‌های متریل
              </StatusBadge>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-xl font-black leading-tight text-ui-text-primary sm:text-4xl">
                شرکت‌های شما
              </h1>
              <p className="hidden text-sm leading-7 text-ui-text-secondary sm:block">
                شرکت‌های فعال و دعوت‌های در انتظار تأیید به‌صورت جداگانه نمایش داده می‌شوند.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_3rem] gap-2 sm:flex sm:flex-wrap">
            <Button
              className={classNames(
                "w-full shrink-0 sm:w-auto",
                shouldHighlightCreateCompany &&
                  "ring-2 ring-emerald-200/80 ring-offset-2 ring-offset-slate-950"
              )}
              data-tour="add-company-btn"
              onClick={goToCreate}
            >
              <Plus className="h-4 w-4" />
              افزودن شرکت
            </Button>
            <Button
              aria-label="به‌روزرسانی شرکت‌ها"
              className="w-full px-0 sm:w-auto sm:px-4"
              disabled={isFetching}
              onClick={() => refetch()}
              variant="secondary"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">به‌روزرسانی</span>
            </Button>
          </div>
        </div>
      </GlassCard>

      <PendingInvitationsSection skip={!sessionReady} />

      {isLoading ? (
        <GlassCard className="flex min-h-32 items-center justify-center p-5 sm:min-h-48 sm:p-8">
          <div className="flex items-center gap-3 text-sm font-bold text-ui-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-ui-primary" />
            در حال دریافت شرکت‌ها
          </div>
        </GlassCard>
      ) : null}

      {!isLoading && error ? (
        <EmptyState
          action={
            <Button onClick={() => refetch()} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(error)}
          icon={<XCircle className="h-7 w-7" />}
          title="دریافت شرکت‌ها ناموفق بود"
        />
      ) : null}

      {!isLoading && !error && companies.length === 0 ? (
        <EmptyState
          action={
            pendingInvitationCount > 0 ? undefined : (
              <Button onClick={goToCreate}>
                <Plus className="h-4 w-4" />
                افزودن شرکت
              </Button>
            )
          }
          description={
            pendingInvitationCount > 0
              ? "هنوز شرکت فعالی ندارید. دعوت‌های در انتظار را در بخش بالا تأیید یا رد کنید."
              : "هنوز شرکتی برای این حساب ثبت نشده است. ساخت شرکت، نقطه ورود به فضای کار متریل است."
          }
          icon={<Building2 className="h-7 w-7" />}
          title={pendingInvitationCount > 0 ? "شرکت فعال ندارید" : "اولین شرکت خود را بسازید"}
        />
      ) : null}

      {!isLoading && !error && companies.length > 0 ? (
        <section className="space-y-2.5 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black text-ui-text-primary sm:text-lg">
              {companyCount} شرکت فعال قابل دسترس
            </h2>
            {data?.next ? (
              <StatusBadge tone="amber">صفحه‌های بعدی در نسخه‌های آینده تکمیل می‌شود</StatusBadge>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-tour="company-list">
            {companies.map((company) => (
              <GlassCard className="p-3 sm:p-4" interactive key={company.id}>
                <Link className="block min-h-11 focus:outline-none" to={`/companies/${company.id}`}>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 space-y-1.5 sm:space-y-2">
                      <StatusBadge tone={company.is_active ? "emerald" : "amber"}>
                        {company.is_active ? "فعال" : "غیرفعال"}
                      </StatusBadge>
                      <div>
                        <h3 className="truncate text-base font-black text-ui-text-primary sm:text-lg">
                          {company.name}
                        </h3>
                        {company.legal_name ? (
                          <p className="mt-1 truncate text-sm text-ui-text-secondary">
                            {company.legal_name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <ArrowLeft className="mt-2 h-5 w-5 shrink-0 text-ui-primary" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ui-text-muted sm:mt-4 sm:grid sm:gap-2">
                    {company.national_id ? <p>شناسه ملی: {company.national_id}</p> : null}
                    {company.registration_number ? <p>شماره ثبت: {company.registration_number}</p> : null}
                  </div>
                </Link>
              </GlassCard>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
