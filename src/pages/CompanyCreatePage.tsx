import { type FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Loader2, XCircle } from "lucide-react";
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

type CompanyFieldProps = {
  className?: string;
  field: keyof CompanyFormState;
  form: CompanyFormState;
  inputMode?: "numeric";
  label: string;
  ltr?: boolean;
  placeholder: string;
  required?: boolean;
  updateField: (field: keyof CompanyFormState, value: string) => void;
};

function CompanyField({
  className,
  field,
  form,
  inputMode,
  label,
  ltr = false,
  placeholder,
  required = false,
  updateField
}: CompanyFieldProps) {
  return (
    <label className={classNames("min-w-0 space-y-2", className)}>
      <span className="text-sm font-bold text-slate-200 light:text-slate-700">{label}</span>
      <input
        className={classNames(inputClasses, ltr && "text-left")}
        dir={ltr ? "ltr" : undefined}
        inputMode={inputMode}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholder}
        required={required}
        value={form[field]}
      />
    </label>
  );
}

export function CompanyCreatePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createCompany, createState] = useCreateCompanyMutation();
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isOptionalInfoOpen, setIsOptionalInfoOpen] = useState(false);

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 pb-6 pt-3 sm:gap-5 sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
      <GlassCard className="p-4 sm:p-6">
        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <button
              aria-label="بازگشت به لیست شرکت‌ها"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white light:border-slate-200 light:bg-slate-50 light:text-slate-600 light:hover:text-slate-900 sm:mt-1 sm:h-9 sm:w-9 sm:border-transparent sm:bg-transparent"
              onClick={() => navigate("/companies")}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-black text-white light:text-slate-950 sm:text-2xl">افزودن شرکت</h1>
              <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-600 sm:mt-2 sm:leading-7">
                فقط نام شرکت الزامی است. سایر اطلاعات را هر زمان لازم بود تکمیل کنید.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <CompanyField
              field="name"
              form={form}
              label="نام شرکت *"
              placeholder="مثلاً شرکت نمونه متریل"
              required
              updateField={updateField}
            />

            <button
              aria-controls="optional-company-info"
              aria-expanded={isOptionalInfoOpen}
              className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-200 light:border-slate-200 light:bg-slate-50 sm:hidden"
              onClick={() => setIsOptionalInfoOpen((current) => !current)}
              type="button"
            >
              اطلاعات تکمیلی
              <span className="flex items-center gap-2 text-xs font-medium text-slate-400 light:text-slate-500">
                اختیاری
                <ChevronDown
                  className={classNames(
                    "h-4 w-4 transition-transform",
                    isOptionalInfoOpen && "rotate-180"
                  )}
                />
              </span>
            </button>
            <div
              className={classNames(
                "col-span-full grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:contents sm:border-0 sm:bg-transparent sm:p-0 light:border-slate-200 light:bg-slate-50",
                isOptionalInfoOpen ? "grid" : "hidden"
              )}
              id="optional-company-info"
            >
                <CompanyField
                  className="col-span-2 sm:col-span-1"
                  field="legal_name"
                  form={form}
                  label="نام حقوقی"
                  placeholder="اختیاری"
                  updateField={updateField}
                />
                <CompanyField
                  field="registration_number"
                  form={form}
                  inputMode="numeric"
                  label="شماره ثبت"
                  placeholder="اختیاری"
                  updateField={updateField}
                />
                <CompanyField
                  field="national_id"
                  form={form}
                  inputMode="numeric"
                  label="شناسه ملی"
                  placeholder="اختیاری"
                  updateField={updateField}
                />
                <CompanyField
                  className="col-span-2"
                  field="active_slug"
                  form={form}
                  label="شناسه کوتاه شرکت"
                  ltr
                  placeholder="optional-company-slug"
                  updateField={updateField}
                />
            </div>
          </div>

          {formError ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              <XCircle className="mt-1 h-4 w-4 shrink-0" />
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Button className="w-full sm:w-auto" disabled={createState.isLoading} type="submit">
              {createState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              ساخت شرکت
            </Button>
            <Button
              className="w-full sm:w-auto"
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
