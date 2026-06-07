import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  XCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearCreateCompanyHighlight } from "../features/auth/authSlice";
import {
  type CompanyRequest,
  useCreateCompanyMutation,
  useListCompaniesQuery
} from "../features/companies/companyApi";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames } from "../shared/utils/classNames";
import { normalizeNumberInput } from "../shared/utils/numberText";

type CompanyFormState = {
  name: string;
  legal_name: string;
  registration_number: string;
  national_id: string;
  active_slug: string;
};

const emptyCompanyForm: CompanyFormState = {
  name: "",
  legal_name: "",
  registration_number: "",
  national_id: "",
  active_slug: ""
};

const inputClasses =
  "h-12 w-full rounded-lg border border-white/10 bg-slate-950/45 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

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

  return "در ارتباط با سرور خطایی رخ داد. لطفاً دوباره تلاش کنید.";
}

function buildCompanyPayload(form: CompanyFormState): CompanyRequest {
  const payload: CompanyRequest = {
    name: form.name.trim()
  };

  const optionalFields: Array<keyof Omit<CompanyFormState, "name">> = [
    "legal_name",
    "registration_number",
    "national_id",
    "active_slug"
  ];

  optionalFields.forEach((field) => {
    const rawValue = form[field].trim();
    const value =
      field === "registration_number" || field === "national_id"
        ? normalizeNumberInput(rawValue)
        : rawValue;

    if (value) {
      payload[field] = value;
    }
  });

  return payload;
}

export function CompanyListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const shouldHighlightCreateCompany = useAppSelector(
    (state) => state.auth.shouldHighlightCreateCompany
  );
  const { data, error, isFetching, isLoading, refetch } = useListCompaniesQuery();
  const [createCompany, createState] = useCreateCompanyMutation();
  const [isFormOpen, setIsFormOpen] = useState(shouldHighlightCreateCompany);
  const [form, setForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const companies = data?.results ?? [];
  const companyCount = data?.count ?? companies.length;

  function openCreateForm() {
    setIsFormOpen(true);
    dispatch(clearCreateCompanyHighlight());
  }

  function updateField(field: keyof CompanyFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const payload = buildCompanyPayload(form);

    if (!payload.name) {
      setFormError("نام شرکت الزامی است.");
      return;
    }

    try {
      const createdCompany = await createCompany(payload).unwrap();
      setForm(emptyCompanyForm);
      setIsFormOpen(false);
      navigate(`/companies/${createdCompany.id}`);
    } catch (createError) {
      setFormError(getApiErrorMessage(createError));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <StatusBadge tone="emerald">
              <Sparkles className="h-3.5 w-3.5" />
              فاز ۴ رتب
            </StatusBadge>
            <div className="space-y-3">
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                شرکت‌های شما
              </h1>
              <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
                بعد از ورود، فهرست شرکت‌ها از بک‌اند خوانده می‌شود. برای شروع کار در رتب، یک شرکت
                بسازید یا وارد داشبورد شرکت موجود شوید.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className={classNames(
                "shrink-0",
                shouldHighlightCreateCompany &&
                  "ring-2 ring-emerald-200/80 ring-offset-2 ring-offset-slate-950"
              )}
              onClick={openCreateForm}
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

      {isFormOpen ? (
        <GlassCard className="p-5 sm:p-6">
          <form className="space-y-5" onSubmit={handleCreateCompany}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-white light:text-slate-950">افزودن شرکت</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                  فقط فیلدهای پشتیبانی‌شده توسط API ارسال می‌شوند. شناسه‌ها با حفظ مقدار متنی به
                  سرور فرستاده می‌شوند.
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsFormOpen(false);
                  setFormError(null);
                }}
                type="button"
                variant="ghost"
              >
                بستن
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام شرکت</span>
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="مثلاً شرکت نمونه رتب"
                  required
                  value={form.name}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                  نام حقوقی
                </span>
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("legal_name", event.target.value)}
                  placeholder="اختیاری"
                  value={form.legal_name}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                  شماره ثبت
                </span>
                <input
                  className={inputClasses}
                  inputMode="numeric"
                  onChange={(event) => updateField("registration_number", event.target.value)}
                  placeholder="اختیاری"
                  value={form.registration_number}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">شناسه ملی</span>
                <input
                  className={inputClasses}
                  inputMode="numeric"
                  onChange={(event) => updateField("national_id", event.target.value)}
                  placeholder="اختیاری"
                  value={form.national_id}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                  شناسه کوتاه شرکت
                </span>
                <input
                  className={classNames(inputClasses, "text-left")}
                  dir="ltr"
                  onChange={(event) => updateField("active_slug", event.target.value)}
                  placeholder="optional-company-slug"
                  value={form.active_slug}
                />
              </label>
            </div>

            {formError ? (
              <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                <XCircle className="mt-1 h-4 w-4 shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={createState.isLoading} type="submit">
                {createState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                ساخت شرکت و ورود
              </Button>
              <p className="text-xs leading-6 text-slate-400 light:text-slate-500">
                بعد از ساخت، مستقیم وارد داشبورد همان شرکت می‌شوید.
              </p>
            </div>
          </form>
        </GlassCard>
      ) : null}

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
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              افزودن شرکت
            </Button>
          }
          description="هنوز شرکتی برای این حساب ثبت نشده است. ساخت شرکت، نقطه ورود به داشبورد شرکت در رتب است."
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
            {data?.next ? (
              <StatusBadge tone="amber">صفحه‌بندی بیشتر در فازهای بعدی تکمیل می‌شود</StatusBadge>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <GlassCard className="p-5" interactive key={company.id}>
                <Link className="block focus:outline-none" to={`/companies/${company.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <StatusBadge tone={company.is_active ? "emerald" : "amber"}>
                        {company.is_active ? "فعال" : "غیرفعال"}
                      </StatusBadge>
                      <div>
                        <h3 className="text-lg font-black text-white light:text-slate-950">
                          {company.name}
                        </h3>
                        {company.legal_name ? (
                          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                            {company.legal_name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <ArrowLeft className="mt-2 h-5 w-5 text-emerald-200" />
                  </div>
                  <div className="mt-5 grid gap-3 text-xs text-slate-400 light:text-slate-500">
                    <p>شناسه شرکت: {company.id}</p>
                    {company.national_id ? <p>شناسه ملی: {company.national_id}</p> : null}
                    {company.registration_number ? (
                      <p>شماره ثبت: {company.registration_number}</p>
                    ) : null}
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
