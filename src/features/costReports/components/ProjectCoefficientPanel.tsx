import { type FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Power, Trash2, X } from "lucide-react";

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
import { useRecalculateFinancialDocumentMutation } from "../../financialDocuments/financialDocumentApi";
import type { PricebookChapter } from "../../pricebooks/pricebookApi";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { GlassCard } from "../../../shared/components/GlassCard";
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
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue
} from "../costReportUtils";

type RowTarget = {
  chapterLabel: string;
  id: number;
  rowCode: string;
  title: string;
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

export function ProjectCoefficientPanel({
  chapters,
  coefficientSets,
  currentDocument,
  isLoadingSets,
  onDocumentUpdated,
  onSelectedCoefficientSetIdChange,
  projectId,
  selectedCoefficientSetId,
  setsError
}: {
  chapters?: PricebookChapter[];
  coefficientSets: ProjectCoefficientSet[];
  currentDocument?: FinancialDocument | null;
  isLoadingSets: boolean;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  projectId: number;
  selectedCoefficientSetId: number | null;
  setsError: unknown;
}) {
  const selectedSet =
    coefficientSets.find((set) => set.id === selectedCoefficientSetId) ?? null;
  const availableChapters = chapters ?? [];
  const rowTargets = useMemo(() => getRowTargets(currentDocument ?? null), [currentDocument]);
  const documentLocked = isFinancialDocumentLocked(currentDocument ?? null);

  const [setName, setSetName] = useState("");
  const [setError, setSetError] = useState<string | null>(null);
  const [valueForm, setValueForm] = useState<CoefficientValueFormState>(
    initialCoefficientValueForm
  );
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CoefficientValueFormState>(
    initialCoefficientValueForm
  );
  const [mobilePane, setMobilePane] = useState<"add" | "list">("add");
  const [valueError, setValueError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [createSet, createSetState] = useCreateProjectCoefficientSetMutation();
  const [createValue, createValueState] = useCreateCoefficientValueMutation();
  const [updateValue, updateValueState] = useUpdateCoefficientValueMutation();
  const [deleteValue, deleteValueState] = useDeleteCoefficientValueMutation();
  const [recalculateDocument, recalculateDocumentState] =
    useRecalculateFinancialDocumentMutation();
  const {
    data: values = [],
    error: valuesError,
    isLoading: isLoadingValues
  } = useListCoefficientValuesQuery(selectedSet?.id ?? 0, { skip: !selectedSet });

  async function refreshDocumentAfterCoefficientChange() {
    if (!currentDocument) return;
    const updatedDocument = await recalculateDocument(currentDocument.id).unwrap();
    onDocumentUpdated(updatedDocument);
  }

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
      const existingValue = values.find((value) => {
        if (
          value.coefficient_key !== validation.body?.coefficient_key ||
          getValueScope(value) !== validation.body.scope
        ) {
          return false;
        }

        if (validation.body.scope === "chapter") {
          return value.chapter_id === validation.body.chapter_id;
        }

        if (validation.body.scope === "row") {
          return value.row_id === validation.body.row_id;
        }

        return true;
      });

      if (existingValue) {
        await updateValue({
          setId: selectedSet.id,
          valueId: existingValue.id,
          body: validation.body
        }).unwrap();
      } else {
        await createValue({
          setId: selectedSet.id,
          body: validation.body
        }).unwrap();
      }
      setValueForm({
        ...initialCoefficientValueForm,
        label_fa: getCoefficientKeyLabel(initialCoefficientValueForm.coefficient_key)
      });
      setMobilePane("list");
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
    if (documentLocked) {
      setValueError("ضرایب سند قفل‌شده قابل تغییر نیستند.");
      return;
    }

    try {
      await deleteValue({ setId: selectedSet.id, valueId: value.id }).unwrap();
      await refreshDocumentAfterCoefficientChange();
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
        <Field label="نوع ضریب">
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
      </>
    );
  }

  return (
    <GlassCard className="flex max-h-[calc(100dvh-8.5rem)] min-h-0 flex-col overflow-hidden p-0 lg:h-[calc(100dvh-7.5rem)] lg:max-h-none">
      <div className="hidden shrink-0 flex-wrap items-center justify-between gap-3 p-3 sm:flex sm:p-4">
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">ضرایب پروژه</h2>
          <p className="mt-1 hidden text-xs text-slate-400 light:text-slate-500 sm:block">
            ضریب را برای کل پروژه، یک فصل یا یک ردیف مشخص ثبت کنید.
          </p>
        </div>
        <StatusBadge tone={selectedSet ? "emerald" : "amber"}>
          {selectedSet ? (
            <>
              <span className="sm:hidden">فعال</span>
              <span className="hidden sm:inline">مجموعه فعال: {selectedSet.name}</span>
            </>
          ) : (
            "بدون ضریب"
          )}
        </StatusBadge>
      </div>

      <div className="shrink-0 space-y-2 border-white/10 p-3 light:border-slate-200 sm:border-t sm:p-4 lg:pb-3">
        <label className="grid gap-1.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-3">
          <span className="text-xs font-bold text-slate-300 light:text-slate-600 sm:text-sm">
            مجموعه فعال
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
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت مجموعه‌ها
          </div>
        ) : null}
        {setsError ? (
          <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-2.5 text-xs text-rose-100 light:text-rose-700">
            {getApiErrorMessage(setsError)}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <button
            className={classNames(
              "min-h-11 rounded-lg border px-3 py-2 text-xs font-black transition",
              mobilePane === "add"
                ? "border-emerald-300/45 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                : "border-white/10 bg-white/5 text-slate-400 light:border-slate-200 light:bg-white"
            )}
            onClick={() => setMobilePane("add")}
            type="button"
          >
            افزودن ضریب
          </button>
          <button
            className={classNames(
              "min-h-11 rounded-lg border px-3 py-2 text-xs font-black transition",
              mobilePane === "list"
                ? "border-emerald-300/45 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                : "border-white/10 bg-white/5 text-slate-400 light:border-slate-200 light:bg-white"
            )}
            onClick={() => setMobilePane("list")}
            type="button"
          >
            ثبت‌شده‌ها ({values.length})
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 border-t border-white/10 p-3 light:border-slate-200 sm:p-4 lg:overflow-hidden">
        <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <div
            className={classNames(
              "h-full min-h-0 space-y-3 overflow-y-auto overscroll-contain lg:block lg:space-y-4 lg:pl-1 [scrollbar-width:thin]",
              mobilePane === "list" ? "block" : "hidden"
            )}
          >
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
                      className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5 light:border-slate-200 light:bg-white sm:p-3"
                      key={value.id}
                    >
                      {editingValueId === value.id ? (
                        <form className="space-y-3" onSubmit={handleUpdateValue}>
                          {renderValueFormFields(editForm, setEditForm)}
                          <div className="flex flex-wrap gap-2">
                            <Button className="flex-1 sm:flex-none" disabled={updateValueState.isLoading} type="submit">
                              {updateValueState.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              ذخیره
                            </Button>
                            <Button
                              className="flex-1 sm:flex-none"
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
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-black text-white light:text-slate-950">
                                {value.label_fa || getCoefficientKeyLabel(value.coefficient_key)}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-400 light:text-slate-500">
                                {getCoefficientScopeLabel(value.scope)} · {getValueTargetLabel(value)}
                              </p>
                              <p className="mt-1 text-sm font-black text-emerald-200 light:text-emerald-700">
                                ضریب {value.multiplier ?? "1"}
                              </p>
                            </div>
                            <StatusBadge
                              tone={value.is_active === false ? "amber" : "emerald"}
                            >
                              {value.is_active === false ? "غیرفعال" : "فعال"}
                            </StatusBadge>
                          </div>
                          <div className="mt-2 flex gap-1.5 sm:mt-3 sm:gap-2">
                            <button
                              className={linkButtonClasses}
                              disabled={updateValueState.isLoading}
                              onClick={() => beginEdit(value)}
                              aria-label="ویرایش ضریب"
                              title="ویرایش ضریب"
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="hidden sm:inline">ویرایش</span>
                            </button>
                            <button
                              className={linkButtonClasses}
                              disabled={updateValueState.isLoading}
                              onClick={() => void handleToggleValue(value)}
                              aria-label={value.is_active === false ? "فعال‌کردن ضریب" : "غیرفعال‌کردن ضریب"}
                              title={value.is_active === false ? "فعال‌کردن ضریب" : "غیرفعال‌کردن ضریب"}
                              type="button"
                            >
                              <Power className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {value.is_active === false ? "فعال‌کردن" : "غیرفعال‌کردن"}
                              </span>
                            </button>
                            <button
                              className={linkButtonClasses}
                              disabled={
                                deleteValueState.isLoading ||
                                recalculateDocumentState.isLoading ||
                                documentLocked
                              }
                              onClick={() => void handleDeleteValue(value)}
                              aria-label="حذف ضریب"
                              title={
                                documentLocked
                                  ? "ضرایب سند قفل‌شده قابل تغییر نیستند"
                                  : "حذف ضریب"
                              }
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">حذف</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/7 p-4 text-center text-sm text-slate-400 light:border-slate-200 light:bg-white light:text-slate-500">
                مجموعه‌ای برای نمایش انتخاب نشده است.
              </div>
            )}

          </div>

          <div
            className={classNames(
              "h-full min-h-0 space-y-3 overflow-y-auto overscroll-contain lg:block lg:space-y-4 lg:pl-1 [scrollbar-width:thin]",
              mobilePane === "add" ? "block" : "hidden"
            )}
          >
            {!isLoadingSets && !setsError && coefficientSets.length === 0 ? (
              <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-6 text-amber-100 light:text-amber-800">
                ابتدا یک مجموعه بسازید؛ سپس ضریب‌های آن را ثبت کنید.
              </div>
            ) : null}
            <details
              className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-white"
              open={coefficientSets.length === 0 ? true : undefined}
            >
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-black text-slate-200 light:text-slate-800 sm:min-h-0">
                ساخت مجموعه جدید
              </summary>
              <form className="mt-3 space-y-3" onSubmit={handleCreateSet}>
                <Field label="نام مجموعه">
                  <input
                    className={inputClasses}
                    onChange={(event) => setSetName(event.target.value)}
                    placeholder="مثلا ضرایب قرارداد اصلی"
                    value={setName}
                  />
                </Field>
                <Button
                  className="w-full sm:w-auto"
                  disabled={createSetState.isLoading}
                  type="submit"
                >
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
            </details>

            <form className="space-y-3 rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-white" onSubmit={handleCreateValue}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-white light:text-slate-950">
                  افزودن ضریب
                </p>
                <Plus className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
              </div>
              {renderValueFormFields(valueForm, setValueForm)}
              <Button
                className="w-full sm:w-auto"
                disabled={!selectedSet || createValueState.isLoading || updateValueState.isLoading}
                type="submit"
              >
                {createValueState.isLoading || updateValueState.isLoading ? (
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
