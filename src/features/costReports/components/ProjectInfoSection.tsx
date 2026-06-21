import { GlassCard } from "../../../shared/components/GlassCard";
import { Field } from "../../../shared/components/Field";
import { JalaliDateField } from "../../../shared/components/JalaliDateField";
import { FolderKanban } from "lucide-react";
import { inputClasses, textareaClasses } from "../constants";
import type { WizardFormState } from "../types";

export function ProjectInfoSection({
  form,
  onFieldChange
}: {
  form: WizardFormState;
  onFieldChange: (field: keyof WizardFormState, value: string) => void;
}) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <FolderKanban className="mt-1 h-5 w-5 text-emerald-200" />
        <div>
          <h2 className="text-xl font-black text-white light:text-slate-950">اطلاعات پروژه</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            سال پایه به صورت پیش‌فرض ۱۴۰۴ است و برای این صورت‌بها استفاده می‌شود.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="نام پروژه" required>
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("project_name", event.target.value)}
            placeholder="مثلاً پروژه نمونه متریل"
            required
            value={form.project_name}
          />
        </Field>
        <Field label="کد پروژه">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("project_code", event.target.value)}
            placeholder="اختیاری"
            value={form.project_code}
          />
        </Field>
        <Field label="شماره قرارداد">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("contract_number", event.target.value)}
            placeholder="اختیاری"
            value={form.contract_number}
          />
        </Field>
        <Field label="سال پایه">
          <input
            className={inputClasses}
            inputMode="numeric"
            onChange={(event) => onFieldChange("base_year", event.target.value)}
            value={form.base_year}
          />
        </Field>
        <Field label="کارفرما">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("employer_name", event.target.value)}
            placeholder="اختیاری"
            value={form.employer_name}
          />
        </Field>
        <Field label="مشاور">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("consultant_name", event.target.value)}
            placeholder="اختیاری"
            value={form.consultant_name}
          />
        </Field>
        <Field label="پیمانکار">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("contractor_name", event.target.value)}
            placeholder="اختیاری"
            value={form.contractor_name}
          />
        </Field>
        <Field label="دستگاه اجرایی">
          <input
            className={inputClasses}
            onChange={(event) =>
              onFieldChange("executive_agency_name", event.target.value)
            }
            placeholder="اختیاری"
            value={form.executive_agency_name}
          />
        </Field>
        <Field label="تاریخ شروع">
          <JalaliDateField
            inputClass={inputClasses}
            onChange={(iso) => onFieldChange("starts_on", iso)}
            value={form.starts_on}
          />
        </Field>
        <Field label="تاریخ پایان">
          <JalaliDateField
            inputClass={inputClasses}
            onChange={(iso) => onFieldChange("ends_on", iso)}
            value={form.ends_on}
          />
        </Field>
        <Field className="md:col-span-2" label="توضیحات پروژه">
          <textarea
            className={textareaClasses}
            onChange={(event) => onFieldChange("description", event.target.value)}
            placeholder="اختیاری"
            value={form.description}
          />
        </Field>
      </div>

    </GlassCard>
  );
}
