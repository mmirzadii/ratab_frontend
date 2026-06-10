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
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { classNames } from "../shared/utils/classNames";

export function CompanyListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const shouldHighlightCreateCompany = useAppSelector(
    (state) => state.auth.shouldHighlightCreateCompany
  );
  const { data, error, isFetching, isLoading, refetch } = useListCompaniesQuery();

  const companies = data?.results ?? [];
  const companyCount = data?.count ?? companies.length;

  function goToCreate() {
    dispatch(clearCreateCompanyHighlight());
    navigate("/companies/new");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <StatusBadge tone="emerald">
              <Sparkles className="h-3.5 w-3.5" />
              فضای شرکت‌های متریل
            </StatusBadge>
            <div className="space-y-2">
              <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                شرکت‌های شما
              </h1>
              <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
                یک شرکت را انتخاب کنید یا شرکت تازه بسازید تا وارد پیام‌ها و صورت‌بها شوید.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className={classNames(
                "shrink-0",
                shouldHighlightCreateCompany &&
                  "ring-2 ring-emerald-200/80 ring-offset-2 ring-offset-slate-950"
              )}
              onClick={goToCreate}
            >
              <Plus className="h-4 w-4" />
              افزودن شرکت
            </Button>
            <Button disabled={isFetching} onClick={() => refetch()} variant="secondary">
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              به‌روزرسانی
            </Button>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <GlassCard className="flex min-h-48 items-center justify-center p-8">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
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
            <Button onClick={goToCreate}>
              <Plus className="h-4 w-4" />
              افزودن شرکت
            </Button>
          }
          description="هنوز شرکتی برای این حساب ثبت نشده است. ساخت شرکت، نقطه ورود به فضای کار متریل است."
          icon={<Building2 className="h-7 w-7" />}
          title="اولین شرکت خود را بسازید"
        />
      ) : null}

      {!isLoading && !error && companies.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white light:text-slate-950">
              {companyCount} شرکت قابل دسترس
            </h2>
            {data?.next ? <StatusBadge tone="amber">صفحه‌های بعدی در نسخه‌های آینده تکمیل می‌شود</StatusBadge> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <GlassCard className="p-4" interactive key={company.id}>
                <Link className="block focus:outline-none" to={`/companies/${company.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <StatusBadge tone={company.is_active ? "emerald" : "amber"}>
                        {company.is_active ? "فعال" : "غیرفعال"}
                      </StatusBadge>
                      <div>
                        <h3 className="truncate text-lg font-black text-white light:text-slate-950">
                          {company.name}
                        </h3>
                        {company.legal_name ? (
                          <p className="mt-1 truncate text-sm text-slate-300 light:text-slate-600">
                            {company.legal_name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <ArrowLeft className="mt-2 h-5 w-5 shrink-0 text-emerald-200" />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-slate-400 light:text-slate-500">
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
