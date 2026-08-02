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
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <FolderKanban className="h-5 w-5 text-ui-primary" />
        <h2 className="text-lg font-black text-ui-text-primary sm:text-xl">اطلاعات پروژه</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
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
            value={form.project_code}
          />
        </Field>
        <Field label="شماره قرارداد">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("contract_number", event.target.value)}
            value={form.contract_number}
          />
        </Field>
        <Field
          help="سال پایه فهرست‌بها برای این صورت‌بها؛ پیش‌فرض ۱۴۰۴ است."
          label="سال پایه"
        >
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
            value={form.employer_name}
          />
        </Field>
        <Field label="مشاور">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("consultant_name", event.target.value)}
            value={form.consultant_name}
          />
        </Field>
        <Field label="پیمانکار">
          <input
            className={inputClasses}
            onChange={(event) => onFieldChange("contractor_name", event.target.value)}
            value={form.contractor_name}
          />
        </Field>
        <Field label="دستگاه اجرایی">
          <input
            className={inputClasses}
            onChange={(event) =>
              onFieldChange("executive_agency_name", event.target.value)
            }
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
            value={form.description}
          />
        </Field>
      </div>
    </GlassCard>
  );
}
