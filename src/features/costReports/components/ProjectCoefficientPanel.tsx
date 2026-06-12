import { type FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Plus, X } from "lucide-react";

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
import { Button } from "../../../shared/components/Button";
import { GlassCard } from "../../../shared/components/GlassCard";
import { HelpHint } from "../../../shared/components/HelpHint";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { Field } from "../../../shared/components/Field";
import { classNames, linkButtonClasses } from "../../../shared/utils/classNames";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import {
  coefficientKeyOptions,
  initialCoefficientValueForm,
  inputClasses
} from "../constants";
import type { CoefficientKey, CoefficientValueFormState } from "../types";
import {
  getCoefficientKeyLabel,
  getCoefficientScopeLabel,
  isPositiveDecimal,
  normalizeQuantityValue
} from "../costReportUtils";

export function ProjectCoefficientPanel({
  coefficientSets,
  isLoadingSets,
  onSelectedCoefficientSetIdChange,
  projectId,
  selectedCoefficientSetId,
  setsError
}: {
  coefficientSets: ProjectCoefficientSet[];
  isLoadingSets: boolean;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  projectId: number;
  selectedCoefficientSetId: number | null;
  setsError: unknown;
}) {
  const selectedSet =
    coefficientSets.find((set) => set.id === selectedCoefficientSetId) ?? null;
  const [setName, setSetName] = useState("");
  const [setError, setSetError] = useState<string | null>(null);
  const [valueForm, setValueForm] = useState<CoefficientValueFormState>(
    initialCoefficientValueForm
  );
  const [valueError, setValueError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [createSet, createSetState] = useCreateProjectCoefficientSetMutation();
  const [createValue, createValueState] = useCreateCoefficientValueMutation();
  const [updateValue, updateValueState] = useUpdateCoefficientValueMutation();
  const [deleteValue, deleteValueState] = useDeleteCoefficientValueMutation();
  const {
    data: values = [],
    error: valuesError,
    isLoading: isLoadingValues
  } = useListCoefficientValuesQuery(selectedSet?.id ?? 0, { skip: !selectedSet });

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

  function updateCoefficientKey(key: CoefficientKey) {
    setValueForm((current) => ({
      ...current,
      coefficient_key: key,
      label_fa: getCoefficientKeyLabel(key)
    }));
  }

  useEffect(() => {
    if (!popoverOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPopoverOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popoverOpen]);

  async function handleCreateValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValueError(null);

    if (!selectedSet) {
      setValueError("ابتدا یک مجموعه ضرایب بسازید یا انتخاب کنید.");
      return;
    }

    const label = valueForm.label_fa.trim();
    if (!label) {
      setValueError("عنوان ضریب را وارد کنید.");
      return;
    }

    const multiplier = normalizeQuantityValue(valueForm.multiplier);
    if (!isPositiveDecimal(multiplier)) {
      setValueError("ضریب باید یک عدد مثبت باشد.");
      return;
    }

    try {
      await createValue({
        setId: selectedSet.id,
        body: {
          coefficient_key: valueForm.coefficient_key,
          scope: "project" as ScopeEnum,
          chapter_id: null,
          row_id: null,
          label_fa: label,
          multiplier,
          is_active: true
        }
      }).unwrap();
      setValueForm({
        ...initialCoefficientValueForm,
        label_fa: getCoefficientKeyLabel(initialCoefficientValueForm.coefficient_key)
      });
      setPopoverOpen(false);
    } catch (error) {
      setValueError(getApiErrorMessage(error));
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

  return (
    <GlassCard className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white light:text-slate-950">
            ضرایب پروژه
            <HelpHint text="ضریب فعال برای محاسبه آیتم‌ها اینجا انتخاب می‌شود؛ مدیریت کامل در همین بخش باز می‌شود." />
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={selectedSet ? "emerald" : "amber"}>
            {selectedSet ? `ضریب فعال: ${selectedSet.name}` : "بدون ضریب"}
          </StatusBadge>
          <span className={linkButtonClasses}>
            نمایش / ویرایش ضرایب
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </div>
      </div>

      <div className="border-t border-white/10 p-5 light:border-slate-200">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
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
                هنوز مجموعه ضرایبی برای این پروژه ثبت نشده است.
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
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white light:text-slate-950">
                            {value.label_fa ||
                              getCoefficientKeyLabel(value.coefficient_key)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                            {getCoefficientKeyLabel(value.coefficient_key)} |{" "}
                            {getCoefficientScopeLabel(value.scope)} | ضریب{" "}
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
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <form className="space-y-3" onSubmit={handleCreateSet}>
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

            <div className="relative" ref={popoverRef}>
              <button
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50 light:border-slate-200 light:bg-white light:text-slate-700"
                disabled={!selectedSet}
                onClick={() => setPopoverOpen((v) => !v)}
                type="button"
              >
                <Plus className="h-4 w-4" />
                افزودن ضریب
              </button>
              {popoverOpen ? (
                <div className="absolute left-0 bottom-full z-30 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-white/10 bg-slate-900 p-4 shadow-2xl light:border-slate-200 light:bg-white">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black text-white light:text-slate-950">افزودن ضریب</p>
                    <button
                      className="rounded p-1 text-slate-400 transition hover:text-white light:hover:text-slate-900"
                      onClick={() => setPopoverOpen(false)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form className="space-y-3" onSubmit={handleCreateValue}>
                    <Field label="نوع ضریب">
                      <select
                        className={inputClasses}
                        onChange={(event) =>
                          updateCoefficientKey(event.target.value as CoefficientKey)
                        }
                        value={valueForm.coefficient_key}
                      >
                        {coefficientKeyOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="عنوان نمایشی">
                      <input
                        className={inputClasses}
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            label_fa: event.target.value
                          }))
                        }
                        value={valueForm.label_fa}
                      />
                    </Field>
                    <Field label="ضریب">
                      <input
                        className={classNames(inputClasses, "text-left")}
                        dir="ltr"
                        inputMode="decimal"
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            multiplier: event.target.value
                          }))
                        }
                        placeholder="1.1"
                        value={valueForm.multiplier}
                      />
                    </Field>
                    <Button disabled={createValueState.isLoading} type="submit">
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
