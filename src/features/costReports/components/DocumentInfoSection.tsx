import { FileText, XCircle } from "lucide-react";

import type { Pricebook, PricebookEdition } from "../../pricebooks/pricebookApi";
import { GlassCard } from "../../../shared/components/GlassCard";
import { Field } from "../../../shared/components/Field";
import { JalaliDateField } from "../../../shared/components/JalaliDateField";
import { classNames } from "../../../shared/utils/classNames";
import { inputClasses } from "../constants";
import type { WizardFormState } from "../types";

export function DocumentInfoSection({
  editions,
  editionsError,
  form,
  formError,
  isAdvancedDevOpen,
  isDevPriceSetConfirmed,
  isLoadingEditions,
  isLoadingPricebooks,
  onAdvancedDevOpenChange,
  onDevPriceSetConfirmedChange,
  onEditionChange,
  onFieldChange,
  onPricebookChange,
  pricebooks,
  pricebooksError,
  selectedActivePriceSet,
  selectedEdition,
  selectedPricebook
}: {
  editions: PricebookEdition[];
  editionsError: unknown;
  form: WizardFormState;
  formError: string | null;
  isAdvancedDevOpen: boolean;
  isDevPriceSetConfirmed: boolean;
  isLoadingEditions: boolean;
  isLoadingPricebooks: boolean;
  onAdvancedDevOpenChange: (open: boolean) => void;
  onDevPriceSetConfirmedChange: (confirmed: boolean) => void;
  onEditionChange: (value: string) => void;
  onFieldChange: (field: keyof WizardFormState, value: string) => void;
  onPricebookChange: (value: string) => void;
  pricebooks: Pricebook[];
  pricebooksError: unknown;
  selectedActivePriceSet: { id: number } | null;
  selectedEdition: PricebookEdition | undefined;
  selectedPricebook: Pricebook | undefined;
}) {
  return (
    <>
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <FileText className="mt-1 h-5 w-5 text-violet-200" />
          <div>
            <h2 className="text-xl font-black text-white light:text-slate-950">
              اطلاعات صورت‌بها
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
              اطلاعات گزارش را وارد کنید. این نسخه آزمایشی مرور فهرست‌بهای فعال ۱۴۰۴ را بدون
              نمایش شناسه‌های فنی شروع می‌کند.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="عنوان صورت‌بها" required>
            <input
              className={inputClasses}
              onChange={(event) => onFieldChange("document_title", event.target.value)}
              placeholder="مثلاً صورت‌بهای ماه اول"
              required
              value={form.document_title}
            />
          </Field>
          <Field label="عنوان گزارش">
            <input
              className={inputClasses}
              onChange={(event) => onFieldChange("report_title", event.target.value)}
              placeholder="اختیاری"
              value={form.report_title}
            />
          </Field>
          <Field label="شماره سند">
            <input
              className={inputClasses}
              onChange={(event) => onFieldChange("document_number", event.target.value)}
              placeholder="اختیاری"
              value={form.document_number}
            />
          </Field>
          <Field label="تاریخ سند">
            <JalaliDateField
              inputClass={inputClasses}
              onChange={(iso) => onFieldChange("document_date", iso)}
              value={form.document_date}
            />
          </Field>
          <Field label="شروع دوره">
            <JalaliDateField
              inputClass={inputClasses}
              onChange={(iso) => onFieldChange("period_start_on", iso)}
              value={form.period_start_on}
            />
          </Field>
          <Field label="پایان دوره">
            <JalaliDateField
              inputClass={inputClasses}
              onChange={(iso) => onFieldChange("period_end_on", iso)}
              value={form.period_end_on}
            />
          </Field>
          <Field label="فهرست‌بها و سال">
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className={inputClasses}
                disabled={isLoadingPricebooks || pricebooks.length === 0}
                onChange={(event) => onPricebookChange(event.target.value)}
                value={selectedPricebook?.id ?? ""}
              >
                {pricebooks.map((pricebook) => (
                  <option key={pricebook.id} value={pricebook.id}>
                    {pricebook.code} - {pricebook.title_fa}
                  </option>
                ))}
              </select>
              <select
                className={inputClasses}
                disabled={isLoadingEditions || editions.length === 0}
                onChange={(event) => onEditionChange(event.target.value)}
                value={selectedEdition?.id ?? ""}
              >
                {editions.map((edition) => (
                  <option key={edition.id} value={edition.id}>
                    {edition.year} - {edition.title_fa}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        {pricebooksError || editionsError ? (
          <div className="mt-4 rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100 light:text-rose-700">
            دریافت فهرست‌بهای فعال با خطا روبه‌رو شد. لطفاً اتصال به سرویس را بررسی کنید و
            دوباره تلاش کنید.
          </div>
        ) : null}

        {!isLoadingPricebooks && !pricebooksError && pricebooks.length === 0 ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
            هنوز فهرست‌بهایی برای مرور در دسترس نیست.
          </div>
        ) : null}

        {selectedEdition && !selectedActivePriceSet ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
            برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.
          </div>
        ) : null}

        <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100 light:text-emerald-800">
          این نسخه آزمایشی از فهرست‌بهای فعال ۱۴۰۴ استفاده می‌کند. اگر سال انتخابی قیمت فعال
          داشته باشد، سند صورت‌بها هم‌زمان ساخته می‌شود و بعد از محاسبه می‌توانید آیتم‌ها را
          به آن اضافه کنید.
        </div>

        <details
          className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800"
          onToggle={(event) => {
            onAdvancedDevOpenChange(event.currentTarget.open);
            if (!event.currentTarget.open) {
              onDevPriceSetConfirmedChange(false);
            }
          }}
        >
          <summary className="cursor-pointer font-black">تنظیمات پیشرفته توسعه</summary>
          <p className="mt-3">
            این بخش فقط برای تست داخلی است. مسیر عادی از قیمت فعال سال انتخاب‌شده استفاده
            می‌کند؛ این مقدار فقط وقتی لازم است که همان پاسخ هنوز قیمت فعال نداشته باشد.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className="text-xs font-bold">شناسه فنی مجموعه قیمت</span>
              <input
                className={classNames(inputClasses, "text-left")}
                dir="ltr"
                inputMode="numeric"
                onChange={(event) => onFieldChange("price_set_id", event.target.value)}
                placeholder="فقط برای تست توسعه"
                value={form.price_set_id}
              />
            </label>
            <label className="flex items-center gap-2 self-end rounded-lg border border-amber-300/20 px-3 py-3 text-xs font-bold">
              <input
                checked={isDevPriceSetConfirmed}
                disabled={!isAdvancedDevOpen}
                onChange={(event) =>
                  onDevPriceSetConfirmedChange(event.target.checked)
                }
                type="checkbox"
              />
              تایید استفاده آزمایشی
            </label>
          </div>
        </details>
      </GlassCard>

      {formError ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          <XCircle className="mt-1 h-4 w-4 shrink-0" />
          {formError}
        </div>
      ) : null}

      <p className="text-xs leading-6 text-slate-400 light:text-slate-500">
        بعد از موفقیت، فصل‌های فهرست‌بها از سرویس خوانده می‌شوند.
      </p>
    </>
  );
}
