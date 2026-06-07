import { useState } from "react";
import {
  Building2,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  Settings,
  SlidersHorizontal,
  Users,
  XCircle
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { useRetrieveCompanyQuery } from "../features/companies/companyApi";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames } from "../shared/utils/classNames";

const companyNavItems = [
  { label: "پیام‌های شرکت", icon: MessageCircle, active: true },
  { label: "اطلاعات شرکت", icon: Building2 },
  { label: "اعضا", icon: Users },
  { label: "صورت‌بهاها", icon: FileText },
  { label: "ضرایب", icon: SlidersHorizontal },
  { label: "تنظیمات", icon: Settings }
];

const linkButtonClasses =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800";

function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object" && data && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  }

  return "دریافت اطلاعات شرکت ناموفق بود.";
}

export function CompanyDashboardPage() {
  const { companyId } = useParams();
  const parsedCompanyId = Number(companyId);
  const hasValidCompanyId = Number.isInteger(parsedCompanyId) && parsedCompanyId > 0;
  const { data: company, error, isLoading, refetch } = useRetrieveCompanyQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const hasDismissedOnboarding = useAppSelector((state) => state.ui.hasDismissedOnboarding);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  if (!hasValidCompanyId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <EmptyState
          action={
            <Link className={linkButtonClasses} to="/companies">
              بازگشت به شرکت‌ها
            </Link>
          }
          description="شناسه شرکت در مسیر معتبر نیست."
          icon={<XCircle className="h-7 w-7" />}
          title="مسیر شرکت نامعتبر است"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <GlassCard className="flex min-h-72 items-center justify-center p-8">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
            در حال دریافت داشبورد شرکت
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <EmptyState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => refetch()} variant="secondary">
                تلاش دوباره
              </Button>
              <Link className={linkButtonClasses} to="/companies">
                بازگشت به شرکت‌ها
              </Link>
            </div>
          }
          description={getApiErrorMessage(error)}
          icon={<XCircle className="h-7 w-7" />}
          title="دسترسی به شرکت ممکن نشد"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <StatusBadge tone={company.is_active ? "emerald" : "amber"}>
              {company.is_active ? "شرکت فعال" : "شرکت غیرفعال"}
            </StatusBadge>
            <div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                {company.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 light:text-slate-600">
                پیام‌های شرکت صفحه پیش‌فرض این فضاست. برای افزودن صورت‌بها، از دکمه + کنار کادر
                پیام استفاده کنید؛ مثل اضافه کردن یک پیوست در گفتگو.
              </p>
            </div>
          </div>
          <Link className={linkButtonClasses} to="/companies">
            بازگشت به فهرست شرکت‌ها
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <GlassCard className="p-4">
          <div className="space-y-2">
            {companyNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={classNames(
                    "flex h-12 w-full items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition",
                    item.active
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                      : "cursor-not-allowed border-transparent text-slate-400 opacity-70 light:text-slate-500"
                  )}
                  disabled={!item.active}
                  key={item.label}
                  title={item.active ? item.label : "در فازهای بعدی فعال می‌شود"}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="relative min-h-[560px] overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-4 light:border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white light:text-slate-950">پیام‌های شرکت</h2>
                  <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                    صفحه پیش‌فرض داشبورد شرکت
                  </p>
                </div>
              </div>
              <StatusBadge>پیام واقعی هنوز فعال نیست</StatusBadge>
            </div>
          </div>

          <div className="flex min-h-[470px] flex-col justify-between p-5">
            <div className="flex flex-1 items-center justify-center">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-xl font-black text-white light:text-slate-950">
                  هنوز پیامی برای این شرکت وجود ندارد
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-600">
                  این بخش فقط پوسته پیام‌های شرکت را آماده می‌کند. هیچ پیام ساختگی یا داده نمایشی در
                  این صفحه نمایش داده نمی‌شود.
                </p>
              </div>
            </div>

            <div className="relative rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-200 light:bg-white">
              {isAddMenuOpen ? (
                <div className="absolute bottom-[76px] right-4 z-20 w-[min(22rem,calc(100vw-3rem))] rounded-lg border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/95">
                  <Link
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-emerald-400/10 light:hover:bg-emerald-50"
                    onClick={() => setIsAddMenuOpen(false)}
                    to={`/companies/${company.id}/cost-reports/new`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200 light:text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-white light:text-slate-950">
                        افزودن صورت‌بها از فهرست‌بها
                      </span>
                      <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                        شروع از فهرست‌بهای فعال ۱۴۰۴ و مرور فصل‌ها، گروه‌ها و آیتم‌ها.
                      </span>
                    </span>
                  </Link>
                  <button
                    className="mt-1 flex w-full cursor-not-allowed items-start gap-3 rounded-lg px-3 py-3 text-right opacity-55"
                    disabled
                    type="button"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200">
                      <Paperclip className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-white light:text-slate-950">
                        پیوست فایل
                      </span>
                      <span className="mt-1 block text-xs leading-6 text-slate-400 light:text-slate-500">
                        در فازهای بعدی فعال می‌شود.
                      </span>
                    </span>
                  </button>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <button
                  aria-expanded={isAddMenuOpen}
                  aria-label="افزودن از گفتگو"
                  className={classNames(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 light:text-emerald-700",
                    !hasDismissedOnboarding && "ring-4 ring-emerald-200/35"
                  )}
                  onClick={() => setIsAddMenuOpen((current) => !current)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="h-10 flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-500 light:border-slate-200 light:bg-slate-50">
                  نوشتن پیام در فازهای بعدی فعال می‌شود
                </div>
                <button
                  className="flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-white/10 text-slate-500 light:border-slate-200"
                  disabled
                  type="button"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {!hasDismissedOnboarding ? (
        <div className="pointer-events-none fixed bottom-28 right-10 z-30 hidden max-w-xs rounded-lg border border-emerald-300/25 bg-slate-950/85 p-4 text-sm leading-7 text-emerald-100 shadow-2xl backdrop-blur-xl lg:block">
          از دکمه + کنار پیام، صورت‌بها را مثل یک پیوست به گفتگوی شرکت اضافه کنید.
        </div>
      ) : null}

    </div>
  );
}
