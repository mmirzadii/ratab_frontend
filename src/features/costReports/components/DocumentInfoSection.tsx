import { useState } from "react";
import { ChevronDown, XCircle } from "lucide-react";

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
  isExistingDocument,
  isLoadingEditions,
  isLoadingPricebooks,
  onEditionChange,
  onFieldChange,
  onFamilyChange,
  families,
  pricebooksError,
  savedEdition,
  selectedActivePriceSet,
  selectedEdition,
  selectedFamily
}: {
  editions: PricebookEdition[];
  editionsError: unknown;
  form: WizardFormState;
  formError: string | null;
  isExistingDocument: boolean;
  isLoadingEditions: boolean;
  isLoadingPricebooks: boolean;
  onEditionChange: (value: string) => void;
  onFieldChange: (field: keyof WizardFormState, value: string) => void;
  onFamilyChange: (value: string) => void;
  families: Pricebook[];
  pricebooksError: unknown;
  savedEdition: PricebookEdition | undefined;
  selectedActivePriceSet: { id: number } | null;
  selectedEdition: PricebookEdition | undefined;
  selectedFamily: Pricebook | undefined;
}) {
  const [isOptionalInfoOpen, setIsOptionalInfoOpen] = useState(() =>
    Boolean(
      form.report_title ||
        form.document_number ||
        form.document_date ||
        form.period_start_on ||
        form.period_end_on
    )
  );

  const readOnlyFamilyTitle =
    savedEdition?.family_title_fa?.trim() ||
    selectedFamily?.title_fa?.trim() ||
    "—";
  const readOnlyYear = savedEdition?.year ?? selectedEdition?.year ?? null;
  const yearSelectDisabled =
    isExistingDocument ||
    isLoadingEditions ||
    !selectedFamily ||
    editions.length === 0;

  return (
    <>
      <GlassCard className="p-3 sm:p-5 xl:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-4 xl:gap-y-2.5">
          <Field label="عنوان صورت‌بها" required>
            <input
              className={inputClasses}
              disabled={isExistingDocument}
              onChange={(event) => onFieldChange("document_title", event.target.value)}
              placeholder="مثلاً صورت‌بهای ماه اول"
              required
              value={form.document_title}
            />
          </Field>
          {isExistingDocument ? (
            <>
              <Field label="نوع فهرست‌بها">
                <div
                  aria-label="نوع فهرست‌بها"
                  className={`${inputClasses} flex items-center text-ui-text-primary`}
                  data-testid="document-info-family-readonly"
                >
                  {readOnlyFamilyTitle}
                </div>
              </Field>
              <Field label="سال">
                <div
                  aria-label="سال"
                  className={`${inputClasses} flex items-center text-ui-text-primary`}
                  data-testid="document-info-year-readonly"
                >
                  {readOnlyYear ?? "—"}
                </div>
              </Field>
            </>
          ) : (
            <>
              <Field label="نوع فهرست‌بها">
                <select
                  aria-label="نوع فهرست‌بها"
                  className={`${inputClasses} min-w-0 px-2 sm:px-4`}
                  data-testid="document-info-family-select"
                  disabled={isLoadingPricebooks || families.length === 0}
                  onChange={(event) => onFamilyChange(event.target.value)}
                  value={selectedFamily?.id ?? ""}
                >
                  {families.length === 0 ? (
                    <option value="">فهرست‌بهایی نیست</option>
                  ) : null}
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.title_fa}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="سال">
                <select
                  aria-label="سال"
                  className={`${inputClasses} min-w-0 px-2 sm:px-4`}
                  data-testid="document-info-year-select"
                  disabled={yearSelectDisabled}
                  onChange={(event) => onEditionChange(event.target.value)}
                  value={selectedEdition?.id ?? ""}
                >
                  {editions.length === 0 ? (
                    <option value="">سالی موجود نیست</option>
                  ) : null}
                  {editions.map((edition) => (
                    <option key={edition.id} value={edition.id}>
                      {edition.year}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>

        {isExistingDocument ? (
          <p className="mt-2 text-[11px] leading-5 text-ui-text-muted">
            نوع و سال فهرست‌بها پس از ایجاد صورت‌بها ثابت می‌ماند. برای سال یا نوع دیگر، صورت‌بهای
            جدید بسازید.
          </p>
        ) : null}

        <button
          aria-controls="optional-document-info"
          aria-expanded={isOptionalInfoOpen}
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-3 text-sm font-bold text-ui-text-secondary sm:hidden"
          onClick={() => setIsOptionalInfoOpen((current) => !current)}
          type="button"
        >
          <span className="flex items-center gap-2">
            اطلاعات تکمیلی
            <span className="rounded-full bg-ui-surface-subtle px-2 py-0.5 text-[11px] font-medium text-ui-text-muted">
              اختیاری
            </span>
          </span>
          <ChevronDown
            className={classNames(
              "h-4 w-4 transition-transform",
              isOptionalInfoOpen && "rotate-180"
            )}
          />
        </button>

        <div
          className={classNames(
            "mt-3 gap-3 sm:mt-4 sm:grid sm:grid-cols-2 xl:gap-x-4 xl:gap-y-2.5",
            isOptionalInfoOpen ? "grid" : "hidden"
          )}
          id="optional-document-info"
        >
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
        </div>

        {pricebooksError || editionsError ? (
          <div className="mt-4 rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100">
            دریافت فهرست‌بهای فعال با خطا روبه‌رو شد. لطفاً اتصال به سرویس را بررسی کنید و
            دوباره تلاش کنید.
          </div>
        ) : null}

        {!isLoadingPricebooks && !pricebooksError && families.length === 0 ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            هنوز فهرست‌بهایی برای مرور در دسترس نیست.
          </div>
        ) : null}

        {!isExistingDocument &&
        selectedFamily &&
        !isLoadingEditions &&
        !editionsError &&
        editions.length === 0 ? (
          <div
            className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100"
            data-testid="document-info-no-editions"
          >
            برای این نوع فهرست‌بها هنوز سال فعالی ثبت نشده است.
          </div>
        ) : null}

        {!isExistingDocument && selectedEdition && !selectedActivePriceSet ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.
          </div>
        ) : null}

        {isExistingDocument && !savedEdition && !isLoadingEditions ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            نسخه ذخیره‌شده فهرست‌بها در فهرست فعال پیدا نشد؛ مرور ساختار با همان شناسه ادامه
            می‌یابد و نوع/سال تغییر نمی‌کند.
          </div>
        ) : null}

      </GlassCard>

      {formError ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100">
          <XCircle className="mt-1 h-4 w-4 shrink-0" />
          {formError}
        </div>
      ) : null}

    </>
  );
}
