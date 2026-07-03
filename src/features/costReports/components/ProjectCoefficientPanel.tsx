import { type FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  type ProjectCoefficientSet,
  type ProjectCoefficientValue,
  type ScopeEnum,
  useCreateCoefficientValueMutation,
  useCreateProjectCoefficientSetMutation,
  useDeleteCoefficientValueMutation,
  useListCoefficientValuesQuery,
  useUpdateCoefficientValueMutation
} from "../../coefficients/coefficientApi";
import type {
  FinancialDocument,
  FinancialDocumentLine
} from "../../financialDocuments/financialDocumentApi";
import type { PricebookChapter } from "../../pricebooks/pricebookApi";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { GlassCard } from "../../../shared/components/GlassCard";
import { HelpHint } from "../../../shared/components/HelpHint";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames, linkButtonClasses } from "../../../shared/utils/classNames";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import {
  coefficientKeyOptions,
  coefficientScopeOptions,
  initialCoefficientValueForm,
  inputClasses
} from "../constants";
import type {
  CoefficientKey,
  CoefficientScope,
  CoefficientValueFormState
} from "../types";
import {
  getCoefficientKeyLabel,
  getCoefficientScopeLabel,
  isPositiveDecimal,
  normalizeQuantityValue
} from "../costReportUtils";

type RowTarget = {
  chapterLabel: string;
  id: number;
  rowCode: string;
  title: string;
};

type EffectivePreviewRow = {
  chapterValue: ProjectCoefficientValue | null;
  effectiveScope: CoefficientScope;
  effectiveValue: ProjectCoefficientValue;
  key: string;
  projectValue: ProjectCoefficientValue | null;
  rowValue: ProjectCoefficientValue | null;
};

function getValueScope(value: ProjectCoefficientValue): CoefficientScope {
  if (value.scope === "chapter" || value.scope === "row") {
    return value.scope;
  }
  return "project";
}

function getTargetId(form: CoefficientValueFormState): number | null {
  if (form.scope === "chapter") {
    const chapterId = Number(form.chapter_id);
    return Number.isInteger(chapterId) && chapterId > 0 ? chapterId : null;
  }

  if (form.scope === "row") {
    const rowId = Number(form.row_id);
    return Number.isInteger(rowId) && rowId > 0 ? rowId : null;
  }

  return null;
}

function getInitialEditForm(value: ProjectCoefficientValue): CoefficientValueFormState {
  const scope = getValueScope(value);

  return {
    coefficient_key: value.coefficient_key as CoefficientKey,
    scope,
    chapter_id: scope === "chapter" && value.chapter_id ? String(value.chapter_id) : "",
    row_id: scope === "row" && value.row_id ? String(value.row_id) : "",
    label_fa: value.label_fa || getCoefficientKeyLabel(value.coefficient_key),
    multiplier: value.multiplier ?? "1",
    is_active: value.is_active !== false
  };
}

function getRowTargets(document: FinancialDocument | null): RowTarget[] {
  const rowsById = new Map<number, RowTarget>();

  for (const line of document?.lines ?? []) {
    const rowId = getLineRowId(line);
    if (!rowId || rowsById.has(rowId)) continue;

    rowsById.set(rowId, {
      chapterLabel: `${line.chapter_code_snapshot} - ${line.chapter_title_snapshot}`,
      id: rowId,
      rowCode: line.row_code_snapshot,
      title: line.description_snapshot
    });
  }

  return Array.from(rowsById.values()).sort((first, second) =>
    first.rowCode.localeCompare(second.rowCode, "fa")
  );
}

function getLineRowId(line: FinancialDocumentLine): number | null {
  const rowId = Number(line.pricebook_row_id);
  return Number.isInteger(rowId) && rowId > 0 ? rowId : null;
}

function getEffectivePreviewRows(values: ProjectCoefficientValue[]): EffectivePreviewRow[] {
  const activeValues = values.filter((value) => value.is_active !== false);
  const keys = Array.from(new Set(activeValues.map((value) => value.coefficient_key)));

  return keys.flatMap((key) => {
    const keyValues = activeValues.filter((value) => value.coefficient_key === key);
    const rowValue = keyValues.find((value) => getValueScope(value) === "row") ?? null;
    const chapterValue =
      keyValues.find((value) => getValueScope(value) === "chapter") ?? null;
    const projectValue =
      keyValues.find((value) => getValueScope(value) === "project") ?? null;
    const effectiveValue = rowValue ?? chapterValue ?? projectValue;

    if (!effectiveValue) return [];

    return [
      {
        chapterValue,
        effectiveScope: getValueScope(effectiveValue),
        effectiveValue,
        key,
        projectValue,
        rowValue
      }
    ];
  });
}

export function ProjectCoefficientPanel({
  chapters,
  coefficientSets,
  currentDocument,
  isLoadingSets,
  onSelectedCoefficientSetIdChange,
  projectId,
  selectedCoefficientSetId,
  setsError
}: {
  chapters?: PricebookChapter[];
  coefficientSets: ProjectCoefficientSet[];
  currentDocument?: FinancialDocument | null;
  isLoadingSets: boolean;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  projectId: number;
  selectedCoefficientSetId: number | null;
  setsError: unknown;
}) {
  const selectedSet =
    coefficientSets.find((set) => set.id === selectedCoefficientSetId) ?? null;
  const availableChapters = chapters ?? [];
  const rowTargets = useMemo(() => getRowTargets(currentDocument ?? null), [currentDocument]);

  const [setName, setSetName] = useState("");
  const [setError, setSetError] = useState<string | null>(null);
  const [valueForm, setValueForm] = useState<CoefficientValueFormState>(
    initialCoefficientValueForm
  );
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CoefficientValueFormState>(
    initialCoefficientValueForm
  );
  const [valueError, setValueError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [createSet, createSetState] = useCreateProjectCoefficientSetMutation();
  const [createValue, createValueState] = useCreateCoefficientValueMutation();
  const [updateValue, updateValueState] = useUpdateCoefficientValueMutation();
  const [deleteValue, deleteValueState] = useDeleteCoefficientValueMutation();
  const {
    data: values = [],
    error: valuesError,
    isLoading: isLoadingValues
  } = useListCoefficientValuesQuery(selectedSet?.id ?? 0, { skip: !selectedSet });
  const previewRows = useMemo(() => getEffectivePreviewRows(values), [values]);

  async function handleCreateSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetError(null);

    const name = setName.trim();
    if (!name) {
      setSetError("نام مجموعه ضرایب را وارد کنید.");
      return;
    }

    try {
      const createdSet = await createSet({
        projectId,
        body: {
          name,
          is_default: coefficientSets.length === 0
        }
      }).unwrap();
      setSetName("");
      onSelectedCoefficientSetIdChange(createdSet.id);
    } catch (error) {
      setSetError(getApiErrorMessage(error));
    }
  }

  function updateCoefficientKey(
    key: CoefficientKey,
    setter: (updater: (current: CoefficientValueFormState) => CoefficientValueFormState) => void
  ) {
    setter((current) => ({
      ...current,
      coefficient_key: key,
      label_fa: getCoefficientKeyLabel(key)
    }));
  }

  function updateScope(
    scope: CoefficientScope,
    setter: (updater: (current: CoefficientValueFormState) => CoefficientValueFormState) => void
  ) {
    setter((current) => ({
      ...current,
      chapter_id: "",
      row_id: "",
      scope
    }));
  }

  function validateForm(form: CoefficientValueFormState): {
    body:
      | {
          coefficient_key: string;
          scope: ScopeEnum;
          chapter_id: number | null;
          row_id: number | null;
          label_fa: string;
          multiplier: string;
          is_active: boolean;
        }
      | null;
    message: string | null;
  } {
    const label = form.label_fa.trim();
    if (!label) {
      return { body: null, message: "عنوان ضریب را وارد کنید." };
    }

    const multiplier = normalizeQuantityValue(form.multiplier);
    if (!isPositiveDecimal(multiplier)) {
      return { body: null, message: "ضریب باید یک عدد مثبت باشد." };
    }

    const targetId = getTargetId(form);
    if (form.scope === "chapter" && targetId === null) {
      return { body: null, message: "برای ضریب فصل، یک فصل انتخاب کنید." };
    }

    if (form.scope === "row" && targetId === null) {
      return { body: null, message: "برای ضریب ردیف، یک ردیف از سند انتخاب کنید." };
    }

    return {
      body: {
        coefficient_key: form.coefficient_key,
        scope: form.scope as ScopeEnum,
        chapter_id: form.scope === "chapter" ? targetId : null,
        row_id: form.scope === "row" ? targetId : null,
        label_fa: label,
        multiplier,
        is_active: form.is_active
      },
      message: null
    };
  }

  async function handleCreateValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValueError(null);

    if (!selectedSet) {
      setValueError("ابتدا یک مجموعه ضرایب بسازید یا انتخاب کنید.");
      return;
    }

    const validation = validateForm(valueForm);
    if (!validation.body) {
      setValueError(validation.message);
      return;
    }

    try {
      await createValue({
        setId: selectedSet.id,
        body: validation.body
      }).unwrap();
      setValueForm({
        ...initialCoefficientValueForm,
        label_fa: getCoefficientKeyLabel(initialCoefficientValueForm.coefficient_key)
      });
    } catch (error) {
      setValueError(getApiErrorMessage(error));
    }
  }

  async function handleUpdateValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError(null);

    if (!selectedSet || editingValueId === null) return;

    const validation = validateForm(editForm);
    if (!validation.body) {
      setEditError(validation.message);
      return;
    }

    try {
      await updateValue({
        setId: selectedSet.id,
        valueId: editingValueId,
        body: validation.body
      }).unwrap();
      setEditingValueId(null);
    } catch (error) {
      setEditError(getApiErrorMessage(error));
    }
  }

  async function handleToggleValue(value: ProjectCoefficientValue) {
    if (!selectedSet) return;

    try {
      await updateValue({
        setId: selectedSet.id,
        valueId: value.id,
        body: { is_active: !value.is_active }
      }).unwrap();
    } catch (error) {
      setValueError(getApiErrorMessage(error));
    }
  }

  async function handleDeleteValue(value: ProjectCoefficientValue) {
    if (!selectedSet) return;

    try {
      await deleteValue({ setId: selectedSet.id, valueId: value.id }).unwrap();
    } catch (error) {
      setValueError(getApiErrorMessage(error));
    }
  }

  function beginEdit(value: ProjectCoefficientValue) {
    setEditingValueId(value.id);
    setEditForm(getInitialEditForm(value));
    setEditError(null);
  }

  function getChapterLabel(chapterId: number | null | undefined) {
    const chapter = availableChapters.find((item) => item.id === chapterId);
    return chapter ? `${chapter.chapter_code} - ${chapter.title_fa}` : `فصل ${chapterId ?? "-"}`;
  }

  function getRowLabel(rowId: number | null | undefined) {
    const row = rowTargets.find((item) => item.id === rowId);
    return row ? `${row.rowCode} - ${row.title}` : `ردیف ${rowId ?? "-"}`;
  }

  function getValueTargetLabel(value: ProjectCoefficientValue) {
    const scope = getValueScope(value);
    if (scope === "chapter") return getChapterLabel(value.chapter_id);
    if (scope === "row") return getRowLabel(value.row_id);
    return "کل پروژه";
  }

  function renderScopeControls(
    form: CoefficientValueFormState,
    setter: (updater: (current: CoefficientValueFormState) => CoefficientValueFormState) => void
  ) {
    return (
      <>
        <div className="grid grid-cols-3 gap-2">
          {coefficientScopeOptions.map((option) => (
            <button
              className={classNames(
                "rounded-lg border px-3 py-2 text-sm font-bold transition",
                form.scope === option.id
                  ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                  : "border-white/10 bg-white/7 text-slate-300 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
              )}
              key={option.id}
              onClick={() => updateScope(option.id, setter)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {form.scope === "chapter" ? (
          <Field label="فصل هدف">
            <select
              className={inputClasses}
              onChange={(event) =>
                setter((current) => ({ ...current, chapter_id: event.target.value }))
              }
              value={form.chapter_id}
            >
              <option value="">انتخاب فصل</option>
              {availableChapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.chapter_code} - {chapter.title_fa}
                </option>
              ))}
            </select>
            {availableChapters.length === 0 ? (
              <p className="mt-1 text-xs leading-6 text-amber-100 light:text-amber-800">
                فصل‌های سال فهرست‌بهای فعال هنوز بارگذاری نشده‌اند.
              </p>
            ) : null}
          </Field>
        ) : null}

        {form.scope === "row" ? (
          <Field label="ردیف هدف">
            <select
              className={inputClasses}
              onChange={(event) =>
                setter((current) => ({ ...current, row_id: event.target.value }))
              }
              value={form.row_id}
            >
              <option value="">انتخاب ردیف</option>
              {rowTargets.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.rowCode} - {row.title} ({row.chapterLabel})
                </option>
              ))}
            </select>
            {rowTargets.length === 0 ? (
              <p className="mt-1 text-xs leading-6 text-amber-100 light:text-amber-800">
                برای ضریب ردیف، ابتدا یک ردیف از مرور فهرست‌بها به سند اضافه کنید.
              </p>
            ) : null}
          </Field>
        ) : null}
      </>
    );
  }

  function renderValueFormFields(
    form: CoefficientValueFormState,
    setter: (updater: (current: CoefficientValueFormState) => CoefficientValueFormState) => void
  ) {
    return (
      <>
        {renderScopeControls(form, setter)}
        <Field label="کلید/نوع ضریب">
          <select
            className={inputClasses}
            onChange={(event) =>
              updateCoefficientKey(event.target.value as CoefficientKey, setter)
            }
            value={form.coefficient_key}
          >
            {coefficientKeyOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="عنوان ضریب">
          <input
            className={inputClasses}
            onChange={(event) =>
              setter((current) => ({ ...current, label_fa: event.target.value }))
            }
            value={form.label_fa}
          />
        </Field>
        <Field label="مقدار ضریب">
          <input
            className={classNames(inputClasses, "text-left")}
            dir="ltr"
            inputMode="decimal"
            onChange={(event) =>
              setter((current) => ({ ...current, multiplier: event.target.value }))
            }
            placeholder="1.1"
            value={form.multiplier}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-200 light:text-slate-700">
          <input
            checked={form.is_active}
            className="accent-emerald-400"
            onChange={(event) =>
              setter((current) => ({ ...current, is_active: event.target.checked }))
            }
            type="checkbox"
          />
          فعال باشد
        </label>
      </>
    );
  }

  return (
    <GlassCard className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white light:text-slate-950">
            ضرایب
            <HelpHint text="ضرایب انتخاب‌شده فقط به بک‌اند ارسال می‌شوند و محاسبه مبلغ نهایی در فرانت انجام نمی‌شود." />
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            برای هر نوع ضریب، اولویت اعمال با ضریب ردیف است؛ اگر برای ردیف ضریبی تعریف نشده باشد، ضریب فصل و اگر آن هم تعریف نشده باشد، ضریب کل پروژه اعمال می‌شود.
          </p>
        </div>
        <StatusBadge tone={selectedSet ? "emerald" : "amber"}>
          {selectedSet ? `مجموعه فعال: ${selectedSet.name}` : "بدون ضریب"}
        </StatusBadge>
      </div>

      <div className="border-t border-white/10 p-5 light:border-slate-200">
        <div className="mb-4 grid gap-3 rounded-lg border border-violet-300/20 bg-violet-400/10 p-4 text-sm leading-7 text-violet-100 light:border-violet-300/40 light:bg-violet-50 light:text-violet-800 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p>
              ضرایب با نوع‌های متفاوت می‌توانند هم‌زمان اعمال شوند.
            </p>
            <p className="mt-1 text-xs text-violet-200 light:text-violet-700">
              این اولویت فقط برای ضریب‌هایی با کلید/نوع یکسان است.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/7 px-4 py-2 text-sm font-black light:border-violet-200 light:bg-white">
            <span>ردیف</span>
            <span>←</span>
            <span>فصل</span>
            <span>←</span>
            <span>کل پروژه</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                مجموعه فعال برای محاسبه
              </span>
              <select
                className={inputClasses}
                disabled={isLoadingSets}
                onChange={(event) =>
                  onSelectedCoefficientSetIdChange(
                    event.target.value ? Number(event.target.value) : null
                  )
                }
                value={selectedCoefficientSetId ?? ""}
              >
                <option value="">بدون ضریب</option>
                {coefficientSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                    {set.is_default ? " - پیش‌فرض" : ""}
                  </option>
                ))}
              </select>
            </label>

            {isLoadingSets ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال دریافت مجموعه ضرایب
              </div>
            ) : null}

            {setsError ? (
              <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                {getApiErrorMessage(setsError)}
              </div>
            ) : null}

            {!isLoadingSets && !setsError && coefficientSets.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/7 p-3 text-sm leading-7 text-slate-300 light:border-slate-200 light:bg-white light:text-slate-600">
                هنوز مجموعه ضرایبی برای این پروژه ثبت نشده است. یک مجموعه بسازید تا در مودال آیتم‌ها قابل انتخاب باشد.
              </div>
            ) : null}

            {selectedSet ? (
              <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-white light:text-slate-950">
                    مقادیر {selectedSet.name}
                  </p>
                  {isLoadingValues ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-200" />
                  ) : null}
                </div>

                {valuesError ? (
                  <div className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                    {getApiErrorMessage(valuesError)}
                  </div>
                ) : null}

                {!isLoadingValues && !valuesError && values.length === 0 ? (
                  <p className="mt-3 text-sm leading-7 text-slate-400 light:text-slate-500">
                    هنوز مقدار ضریبی ثبت نشده است.
                  </p>
                ) : null}

                <div className="mt-3 space-y-2">
                  {values.map((value) => (
                    <div
                      className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white"
                      key={value.id}
                    >
                      {editingValueId === value.id ? (
                        <form className="space-y-3" onSubmit={handleUpdateValue}>
                          {renderValueFormFields(editForm, setEditForm)}
                          <div className="flex flex-wrap gap-2">
                            <Button disabled={updateValueState.isLoading} type="submit">
                              {updateValueState.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              ذخیره
                            </Button>
                            <Button
                              onClick={() => setEditingValueId(null)}
                              type="button"
                              variant="secondary"
                            >
                              <X className="h-4 w-4" />
                              لغو
                            </Button>
                          </div>
                          {editError ? (
                            <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                              {editError}
                            </p>
                          ) : null}
                        </form>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-white light:text-slate-950">
                                {value.label_fa || getCoefficientKeyLabel(value.coefficient_key)}
                              </p>
                              <p className="mt-1 text-xs leading-6 text-slate-400 light:text-slate-500">
                                {getCoefficientKeyLabel(value.coefficient_key)} |{" "}
                                {getCoefficientScopeLabel(value.scope)} | {getValueTargetLabel(value)} | ضریب{" "}
                                {value.multiplier ?? "1"}
                              </p>
                            </div>
                            <StatusBadge
                              tone={value.is_active === false ? "amber" : "emerald"}
                            >
                              {value.is_active === false ? "غیرفعال" : "فعال"}
                            </StatusBadge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className={linkButtonClasses}
                              disabled={updateValueState.isLoading}
                              onClick={() => beginEdit(value)}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                              ویرایش
                            </button>
                            <button
                              className={linkButtonClasses}
                              disabled={updateValueState.isLoading}
                              onClick={() => void handleToggleValue(value)}
                              type="button"
                            >
                              {value.is_active === false ? "فعال‌کردن" : "غیرفعال‌کردن"}
                            </button>
                            <button
                              className={linkButtonClasses}
                              disabled={deleteValueState.isLoading}
                              onClick={() => void handleDeleteValue(value)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedSet && previewRows.length > 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-white">
                <p className="text-sm font-black text-white light:text-slate-950">
                  پیش‌نمایش اولویت مؤثر
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-right text-xs text-slate-300 light:text-slate-700">
                    <thead className="text-slate-400 light:text-slate-500">
                      <tr>
                        <th className="px-2 py-2">نوع</th>
                        <th className="px-2 py-2">کل پروژه</th>
                        <th className="px-2 py-2">فصل</th>
                        <th className="px-2 py-2">ردیف</th>
                        <th className="px-2 py-2">مؤثر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => (
                        <tr className="border-t border-white/10 light:border-slate-200" key={row.key}>
                          <td className="px-2 py-2 font-bold">
                            {getCoefficientKeyLabel(row.key)}
                          </td>
                          <td className="px-2 py-2">{row.projectValue?.multiplier ?? "-"}</td>
                          <td className="px-2 py-2">{row.chapterValue?.multiplier ?? "-"}</td>
                          <td className="px-2 py-2">{row.rowValue?.multiplier ?? "-"}</td>
                          <td className="px-2 py-2 font-black text-emerald-200 light:text-emerald-700">
                            {row.effectiveValue.multiplier ?? "1"} از{" "}
                            {getCoefficientScopeLabel(row.effectiveScope)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <form className="space-y-3 rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-white" onSubmit={handleCreateSet}>
              <Field label="ساخت مجموعه ضرایب">
                <input
                  className={inputClasses}
                  onChange={(event) => setSetName(event.target.value)}
                  placeholder="مثلا ضرایب قرارداد اصلی"
                  value={setName}
                />
              </Field>
              <Button disabled={createSetState.isLoading} type="submit">
                {createSetState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                ساخت مجموعه
              </Button>
              {setError ? (
                <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                  {setError}
                </p>
              ) : null}
            </form>

            <form className="space-y-3 rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-white" onSubmit={handleCreateValue}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-white light:text-slate-950">
                  افزودن ضریب
                </p>
                <Plus className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
              </div>
              {renderValueFormFields(valueForm, setValueForm)}
              <Button disabled={!selectedSet || createValueState.isLoading} type="submit">
                {createValueState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                ثبت ضریب
              </Button>
              {valueError ? (
                <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                  {valueError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
