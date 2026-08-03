import { useId, useState } from "react";
import { ChevronDown, Plus, X, XCircle } from "lucide-react";

import type { FinancialDocumentPricebook } from "../../financialDocuments/financialDocumentApi";
import type { Pricebook, PricebookEdition } from "../../pricebooks/pricebookApi";
import { Button } from "../../../shared/components/Button";
import { GlassCard } from "../../../shared/components/GlassCard";
import { Field } from "../../../shared/components/Field";
import { JalaliDateField } from "../../../shared/components/JalaliDateField";
import { classNames } from "../../../shared/utils/classNames";
import { inputClasses } from "../constants";
import {
  type DraftPricebookPick,
  formatPricebookSelectionLabel
} from "../pricebookFamilyYear";
import type { WizardFormState } from "../types";

export function DocumentInfoSection({
  canMutateSelections,
  draftPicks,
  editions,
  editionsError,
  form,
  formError,
  isAddingSelection,
  isExistingDocument,
  isLoadingEditions,
  isLoadingPricebooks,
  isRemovingSelectionId,
  onAddSelection,
  onEditionChange,
  onFieldChange,
  onFamilyChange,
  onRemoveDraftPick,
  onRemovePersistedSelection,
  families,
  persistedSelections,
  pricebooksError,
  selectedEdition,
  selectedFamily,
  selectionActionError
}: {
  canMutateSelections: boolean;
  draftPicks: DraftPricebookPick[];
  editions: PricebookEdition[];
  editionsError: unknown;
  form: WizardFormState;
  formError: string | null;
  isAddingSelection: boolean;
  isExistingDocument: boolean;
  isLoadingEditions: boolean;
  isLoadingPricebooks: boolean;
  isRemovingSelectionId: number | null;
  onAddSelection: () => void;
  onEditionChange: (value: string) => void;
  onFieldChange: (field: keyof WizardFormState, value: string) => void;
  onFamilyChange: (value: string) => void;
  onRemoveDraftPick: (editionId: number) => void;
  onRemovePersistedSelection: (selectionId: number) => void;
  families: Pricebook[];
  persistedSelections: FinancialDocumentPricebook[];
  pricebooksError: unknown;
  selectedEdition: PricebookEdition | undefined;
  selectedFamily: Pricebook | undefined;
  selectionActionError: string | null;
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
  const yearSelectId = useId();
  const documentDateInputId = useId();
  const periodStartInputId = useId();
  const periodEndInputId = useId();

  const yearSelectDisabled =
    isLoadingEditions || !selectedFamily || editions.length === 0;
  const selectedEditionIds = new Set(
    isExistingDocument
      ? persistedSelections.map((item) => item.pricebook_edition_id)
      : draftPicks.map((item) => item.editionId)
  );
  const canAdd =
    canMutateSelections &&
    selectedEdition != null &&
    !selectedEditionIds.has(selectedEdition.id) &&
    !isAddingSelection;

  const listEmpty =
    (isExistingDocument ? persistedSelections.length : draftPicks.length) === 0;

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
          <Field label="نوع فهرست‌بها">
            <select
              aria-label="نوع فهرست‌بها"
              className={`${inputClasses} min-w-0 px-2 sm:px-4`}
              data-testid="document-info-family-select"
              disabled={!canMutateSelections || isLoadingPricebooks || families.length === 0}
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
            <div className="flex gap-2">
              <select
                aria-label="سال"
                className={`${inputClasses} min-w-0 flex-1 px-2 sm:px-4`}
                data-testid="document-info-year-select"
                disabled={!canMutateSelections || yearSelectDisabled}
                id={yearSelectId}
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
              {canMutateSelections ? (
                <Button
                  className="shrink-0 px-3"
                  data-testid="document-info-add-pricebook"
                  disabled={!canAdd}
                  onClick={onAddSelection}
                  type="button"
                  variant="secondary"
                >
                  {isAddingSelection ? (
                    "…"
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      افزودن
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </Field>
        </div>

        <div className="mt-3 space-y-2" data-testid="document-info-selected-pricebooks">
          <p className="text-[11px] font-bold text-ui-text-muted">فهرست‌بهای انتخاب‌شده</p>
          {listEmpty ? (
            <p className="rounded-lg border border-ui-warning/25 bg-ui-warning-soft px-3 py-2 text-xs leading-6 text-ui-warning">
              حداقل یک فهرست‌بها باید با «افزودن» به فهرست اضافه شود.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {isExistingDocument
                ? persistedSelections.map((selection) => (
                    <li
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ui-border-subtle bg-ui-surface-subtle px-3 text-xs font-bold text-ui-text-primary"
                      key={selection.id}
                    >
                      <span>
                        {formatPricebookSelectionLabel({
                          familyTitleFa: selection.family_title_fa,
                          year: selection.year
                        })}
                      </span>
                      {canMutateSelections ? (
                        <button
                          aria-label="حذف فهرست‌بها"
                          className="rounded-full p-1 text-ui-text-muted transition hover:bg-ui-surface hover:text-ui-danger disabled:opacity-40"
                          disabled={isRemovingSelectionId === selection.id}
                          onClick={() => onRemovePersistedSelection(selection.id)}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </li>
                  ))
                : draftPicks.map((pick) => (
                    <li
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ui-border-subtle bg-ui-surface-subtle px-3 text-xs font-bold text-ui-text-primary"
                      key={pick.editionId}
                    >
                      <span>
                        {formatPricebookSelectionLabel({
                          familyTitleFa: pick.familyTitleFa,
                          year: pick.year
                        })}
                      </span>
                      <button
                        aria-label="حذف فهرست‌بها"
                        className="rounded-full p-1 text-ui-text-muted transition hover:bg-ui-surface hover:text-ui-danger"
                        onClick={() => onRemoveDraftPick(pick.editionId)}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
            </ul>
          )}
        </div>

        {isExistingDocument && !canMutateSelections ? (
          <p className="mt-2 text-[11px] leading-5 text-ui-text-muted">
            صورت‌بهای قفل‌شده: فهرست‌بهای انتخاب‌شده فقط خواندنی هستند و قابل افزودن یا حذف نیستند.
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
              value={form.report_title}
            />
          </Field>
          <Field label="شماره سند">
            <input
              className={inputClasses}
              onChange={(event) => onFieldChange("document_number", event.target.value)}
              value={form.document_number}
            />
          </Field>
          <Field label="تاریخ سند">
            <JalaliDateField
              id={documentDateInputId}
              inputClass={inputClasses}
              onChange={(iso) => onFieldChange("document_date", iso)}
              value={form.document_date}
            />
          </Field>
          <Field label="شروع دوره">
            <JalaliDateField
              id={periodStartInputId}
              inputClass={inputClasses}
              onChange={(iso) => onFieldChange("period_start_on", iso)}
              value={form.period_start_on}
            />
          </Field>
          <Field label="پایان دوره">
            <JalaliDateField
              id={periodEndInputId}
              inputClass={inputClasses}
              onChange={(iso) => onFieldChange("period_end_on", iso)}
              value={form.period_end_on}
            />
          </Field>
        </div>

        {pricebooksError || editionsError ? (
          <div className="mt-4 rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-4 text-sm leading-7 text-ui-danger">
            دریافت فهرست‌بهای فعال با خطا روبه‌رو شد. لطفاً اتصال به سرویس را بررسی کنید و
            دوباره تلاش کنید.
          </div>
        ) : null}

        {!isLoadingPricebooks && !pricebooksError && families.length === 0 ? (
          <div className="mt-4 rounded-lg border border-ui-warning/25 bg-ui-warning-soft p-4 text-sm leading-7 text-ui-warning">
            هنوز فهرست‌بهایی برای مرور در دسترس نیست.
          </div>
        ) : null}

        {selectedFamily &&
        !isLoadingEditions &&
        !editionsError &&
        editions.length === 0 ? (
          <div
            className="mt-4 rounded-lg border border-ui-warning/25 bg-ui-warning-soft p-4 text-sm leading-7 text-ui-warning"
            data-testid="document-info-no-editions"
          >
            برای این نوع فهرست‌بها هنوز سال فعالی ثبت نشده است.
          </div>
        ) : null}

        {selectionActionError ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-7 text-ui-danger">
            <XCircle className="mt-1 h-4 w-4 shrink-0" />
            {selectionActionError}
          </div>
        ) : null}
      </GlassCard>

      {formError ? (
        <div className="flex items-start gap-2 rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-7 text-ui-danger">
          <XCircle className="mt-1 h-4 w-4 shrink-0" />
          {formError}
        </div>
      ) : null}
    </>
  );
}
