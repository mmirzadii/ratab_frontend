import { type FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import {
  type CompanyRequest,
  useCreateCompanyMutation
} from "../features/companies/companyApi";
import { addToast } from "../features/ui/uiSlice";
import { Button } from "../shared/components/Button";
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

const emptyForm: CompanyFormState = {
  name: "",
  legal_name: "",
  registration_number: "",
  national_id: "",
  active_slug: ""
};

const inputClasses =
  "h-12 w-full rounded-lg border border-white/10 bg-slate-950/45 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

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

export function CompanyCreatePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createCompany, createState] = useCreateCompanyMutation();
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  function updateField(field: keyof CompanyFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const payload = buildPayload(form);

    if (!payload.name) {
      setFormError("نام شرکت الزامی است.");
      return;
    }

    try {
      const createdCompany = await createCompany(payload).unwrap();
      navigate(`/companies/${createdCompany.id}`);
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <GlassCard className="p-4 sm:p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <button
              aria-label="بازگشت به لیست شرکت‌ها"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
              onClick={() => navigate("/companies")}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white light:text-slate-950">افزودن شرکت</h1>
              <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                فقط نام شرکت الزامی است. سایر اطلاعات را هر زمان لازم بود تکمیل کنید.
              </p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام شرکت</span>
              <input
                className={inputClasses}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="مثلاً شرکت نمونه متریل"
                required
                value={form.name}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">نام حقوقی</span>
              <input
                className={inputClasses}
                onChange={(event) => updateField("legal_name", event.target.value)}
                placeholder="اختیاری"
                value={form.legal_name}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شماره ثبت</span>
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
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">شناسه کوتاه شرکت</span>
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

          <div className="flex flex-wrap gap-3">
            <Button disabled={createState.isLoading} type="submit">
              {createState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              ساخت شرکت
            </Button>
            <Button
              disabled={createState.isLoading}
              onClick={() => navigate("/companies")}
              type="button"
              variant="secondary"
            >
              انصراف
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
