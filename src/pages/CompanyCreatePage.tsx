import { type FormEvent, useEffect, useId, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FolderKanban,
  Loader2,
  Users,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import {
  type CompanyRequest,
  useCreateCompanyMutation
} from "../features/companies/companyApi";
import { suggestCompanySlug } from "../features/companies/companySlugSuggest";
import { addToast } from "../features/ui/uiSlice";
import { Button } from "../shared/components/Button";
import { ContextualHelp } from "../shared/components/ContextualHelp";
import { GlassCard } from "../shared/components/GlassCard";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { classNames } from "../shared/utils/classNames";
import { normalizeNumberInput } from "../shared/utils/numberText";

type CompanyFormState = {
  name: string;
  legal_name: string;
  registration_number: string;
  national_id: string;
  active_slug: string;
};

type CreateStep = 1 | 2;

const emptyForm: CompanyFormState = {
  name: "",
  legal_name: "",
  registration_number: "",
  national_id: "",
  active_slug: ""
};

const inputClasses =
  "h-12 w-full rounded-[11px] border border-ui-border-subtle bg-ui-surface-subtle px-3.5 text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/40 focus:bg-ui-surface focus-visible:ring-2 focus-visible:ring-ui-focus";

function buildPayload(form: CompanyFormState): CompanyRequest {
  const payload: CompanyRequest = { name: form.name.trim() };

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

type CompanyFieldProps = {
  className?: string;
  field: keyof CompanyFormState;
  form: CompanyFormState;
  help?: string;
  id: string;
  inputMode?: "numeric";
  label: string;
  ltr?: boolean;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  updateField: (field: keyof CompanyFormState, value: string) => void;
};

function CompanyField({
  className,
  field,
  form,
  help,
  id,
  inputMode,
  label,
  ltr = false,
  placeholder,
  required = false,
  autoFocus = false,
  updateField
}: CompanyFieldProps) {
  return (
    <div className={classNames("min-w-0 space-y-1.5", className)}>
      <span className="flex items-center gap-1">
        <label className="text-sm font-bold text-ui-text-secondary" htmlFor={id}>
          {label}
          {required ? <span className="text-ui-primary"> *</span> : null}
        </label>
        {help ? <ContextualHelp label={`راهنمای ${label}`} text={help} /> : null}
      </span>
      <input
        autoFocus={autoFocus}
        className={classNames(inputClasses, ltr && "text-left")}
        dir={ltr ? "ltr" : undefined}
        id={id}
        inputMode={inputMode}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholder}
        required={required}
        value={form[field]}
      />
    </div>
  );
}

function StepIndicator({ step }: { step: CreateStep }) {
  return (
    <ol
      aria-label="مراحل افزودن شرکت"
      className="flex items-center gap-2 text-xs font-bold"
      data-testid="company-create-steps"
    >
      {[
        { id: 1 as const, label: "اطلاعات اصلی" },
        { id: 2 as const, label: "اطلاعات تکمیلی" }
      ].map((item, index) => {
        const active = step === item.id;
        const done = step > item.id;
        return (
          <li className="flex items-center gap-2" key={item.id}>
            {index > 0 ? (
              <span aria-hidden className="h-px w-4 bg-ui-border-default sm:w-6" />
            ) : null}
            <span
              aria-current={active ? "step" : undefined}
              className={classNames(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition",
                active && "border-ui-primary/35 bg-ui-primary-soft text-ui-primary",
                done && "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary",
                !active && !done && "border-ui-border-subtle text-ui-text-muted"
              )}
            >
              <span
                className={classNames(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  active ? "bg-ui-primary text-ui-primary-foreground" : "bg-ui-surface-subtle"
                )}
              >
                {item.id}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CreateSidePanel({ form, step }: { form: CompanyFormState; step: CreateStep }) {
  const previewName = form.name.trim() || "نام شرکت";
  const previewSlug = form.active_slug.trim();

  return (
    <aside className="hidden min-w-0 lg:block" data-testid="company-create-side-panel">
      <GlassCard className="sticky top-24 space-y-5 p-5">
        <div>
          <p className="text-[11px] font-bold text-ui-text-muted">خلاصه فضای کاری</p>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ui-primary-soft text-ui-primary">
              <Building2 aria-hidden className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-ui-text-primary">{previewName}</p>
              {previewSlug ? (
                <p className="mt-0.5 truncate text-xs text-ui-text-muted" dir="ltr">
                  {previewSlug}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-ui-text-muted">شناسه کوتاه هنوز تنظیم نشده</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-ui-border-subtle pt-4">
          <p className="text-[11px] font-bold text-ui-text-muted">پس از ایجاد شرکت</p>
          <ul className="mt-3 space-y-2.5 text-sm text-ui-text-secondary">
            <li className="flex items-start gap-2.5">
              <Users aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ui-primary" />
              <span>افزودن اعضا و تعیین نقش‌ها</span>
            </li>
            <li className="flex items-start gap-2.5">
              <FolderKanban aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ui-primary" />
              <span>ساخت پروژه و گروه‌های کاری</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ui-primary" />
              <span>مدیریت صورت‌بها و فهرست‌بها</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-3.5 py-3 text-xs leading-5 text-ui-text-muted">
          {step === 1
            ? "برای شروع فقط نام شرکت الزامی است."
            : "اطلاعات تکمیلی اختیاری است و بعداً هم قابل تکمیل است."}
        </div>
      </GlassCard>
    </aside>
  );
}

export function CompanyCreatePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createCompany, createState] = useCreateCompanyMutation();
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<CreateStep>(1);
  const [slugTouched, setSlugTouched] = useState(false);
  const ids = {
    name: useId(),
    legal_name: useId(),
    registration_number: useId(),
    national_id: useId(),
    active_slug: useId()
  };

  useEffect(() => {
    if (step !== 2) return;
    const timer = window.setTimeout(() => {
      document.getElementById(ids.legal_name)?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [step, ids.legal_name]);

  function updateField(field: keyof CompanyFormState, value: string) {
    if (field === "active_slug") {
      setSlugTouched(true);
    }
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugTouched) {
        next.active_slug = suggestCompanySlug(value);
      }
      return next;
    });
    if (formError) setFormError(null);
  }

  function goToStep2() {
    const name = form.name.trim();
    if (!name) {
      setFormError("نام شرکت الزامی است.");
      document.getElementById(ids.name)?.focus();
      return;
    }
    setFormError(null);
    setStep(2);
  }

  async function createCompanyFromForm() {
    const payload = buildPayload(form);

    if (!payload.name) {
      setFormError("نام شرکت الزامی است.");
      setStep(1);
      return;
    }

    try {
      const createdCompany = await createCompany(payload).unwrap();
      navigate(`/companies/${createdCompany.id}`);
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (step === 1) {
      goToStep2();
      return;
    }

    await createCompanyFromForm();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-8 pt-3 sm:gap-5 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <button
            aria-label="بازگشت به لیست شرکت‌ها"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-ui-border-subtle bg-ui-surface text-ui-text-secondary transition hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            onClick={() => navigate("/companies")}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-ui-text-primary sm:text-2xl">
              افزودن شرکت
            </h1>
            <p className="mt-1 text-sm text-ui-text-secondary">
              یک فضای کاری جدید برای شرکت خود ایجاد کنید.
            </p>
          </div>
        </div>
        <StepIndicator step={step} />
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)] lg:items-start lg:gap-5">
        <GlassCard className="p-4 sm:p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {step === 1 ? (
              <section aria-labelledby="company-create-step1-title" className="space-y-4">
                <div>
                  <h2
                    className="text-base font-black text-ui-text-primary"
                    id="company-create-step1-title"
                  >
                    اطلاعات اصلی
                  </h2>
                  <p className="mt-1 text-sm text-ui-text-muted">
                    برای شروع، فقط نام شرکت الزامی است.
                  </p>
                </div>

                <CompanyField
                  autoFocus
                  field="name"
                  form={form}
                  id={ids.name}
                  label="نام شرکت"
                  placeholder="مثلاً شرکت نمونه متریل"
                  required
                  updateField={updateField}
                />
              </section>
            ) : (
              <section aria-labelledby="company-create-step2-title" className="space-y-4">
                <div>
                  <h2
                    className="text-base font-black text-ui-text-primary"
                    id="company-create-step2-title"
                  >
                    اطلاعات تکمیلی
                  </h2>
                  <p className="mt-1 text-sm text-ui-text-muted">
                    در صورت نیاز اکنون تکمیل کنید؛ بعداً هم قابل ویرایش است.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <CompanyField
                    className="sm:col-span-2"
                    field="legal_name"
                    form={form}
                    help="نام ثبت‌شده در اسناد رسمی؛ در صورت تفاوت با نام نمایشی تکمیل شود."
                    id={ids.legal_name}
                    label="نام حقوقی"
                    updateField={updateField}
                  />
                  <CompanyField
                    field="registration_number"
                    form={form}
                    id={ids.registration_number}
                    inputMode="numeric"
                    label="شماره ثبت"
                    updateField={updateField}
                  />
                  <CompanyField
                    field="national_id"
                    form={form}
                    help="شناسه ملی شرکت برای اسناد و گزارش‌های رسمی."
                    id={ids.national_id}
                    inputMode="numeric"
                    label="شناسه ملی"
                    updateField={updateField}
                  />
                  <div className="min-w-0 space-y-1.5 sm:col-span-2">
                    <span className="flex items-center gap-1">
                      <label
                        className="text-sm font-bold text-ui-text-secondary"
                        htmlFor={ids.active_slug}
                      >
                        شناسه کوتاه شرکت
                      </label>
                      <ContextualHelp
                        label="راهنمای شناسه کوتاه شرکت"
                        text="برای آدرس‌ها و ارجاع کوتاه استفاده می‌شود. حروف کوچک لاتین، عدد و خط تیره."
                      />
                    </span>
                    <input
                      className={classNames(inputClasses, "text-left")}
                      dir="ltr"
                      id={ids.active_slug}
                      onChange={(event) => updateField("active_slug", event.target.value)}
                      placeholder="مثلا metril-tehran"
                      value={form.active_slug}
                    />
                    {!slugTouched && form.active_slug ? (
                      <p className="text-[11px] text-ui-text-muted">
                        بر اساس نام شرکت پیشنهاد شده است؛ قابل ویرایش است.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            )}

            {formError ? (
              <div
                className="flex items-start gap-2 rounded-xl border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-6 text-ui-danger"
                role="alert"
              >
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-ui-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="w-full sm:w-auto"
                disabled={createState.isLoading}
                onClick={() => {
                  if (step === 2) {
                    setStep(1);
                    setFormError(null);
                    return;
                  }
                  navigate("/companies");
                }}
                type="button"
                variant="secondary"
              >
                {step === 2 ? "بازگشت" : "انصراف"}
              </Button>

              <Button
                className="w-full min-w-[10rem] sm:w-auto"
                disabled={createState.isLoading}
                type="submit"
              >
                {createState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === 1 ? (
                  <ArrowLeft className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {step === 1 ? "ادامه" : "ساخت شرکت"}
              </Button>
            </div>
          </form>
        </GlassCard>

        <CreateSidePanel form={form} step={step} />
      </div>

      {/* Mobile trust strip — mirrors side panel intent without duplicating a hero */}
      <GlassCard className="p-4 lg:hidden" data-testid="company-create-mobile-summary">
        <p className="text-[11px] font-bold text-ui-text-muted">پس از ایجاد شرکت</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ui-text-secondary">
          <li>افزودن اعضا و پروژه‌ها</li>
          <li>مدیریت گروه‌ها و صورت‌بها</li>
        </ul>
      </GlassCard>
    </div>
  );
}
