import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "../../../app/appShellContext";
import { Check, Loader2, Pencil, RotateCcw, Send, Trash2, X, XCircle } from "lucide-react";

import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import {
  useCalculatePricebookItemMutation,
  useRetrievePricebookItemQuery,
  type PricebookCalculateInputPayload,
  type PricebookCalculateResponse,
  type PricebookItemDetail
} from "../../pricebooks/pricebookApi";
import {
  type FinancialDocumentLineCreatePayload,
  useCreateFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import { Button } from "../../../shared/components/Button";
import { EmptyState } from "../../../shared/components/EmptyState";
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { classNames } from "../../../shared/utils/classNames";
import { inputClasses } from "../constants";
import {
  classifyPricebookItem,
  findMatchedRangeRow,
  getCalculationInputs,
  getInputStateKey,
  getRangeFallbackRow,
  getSelectInputOptions,
  getSelectedRowInput,
  getSelectedRowOptions,
  getManualPriceValidationMessage,
  hasManualUnitPrice,
  isSelectInput,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue,
  parsePriceRanges,
  resolveSelectedRowIdForBackend,
  requiresRowSelection,
  stablePayloadKey
} from "../costReportUtils";
import { CalculationSection, type CalculationRowSelectionOption } from "./CalculationSection";
import { ChecklistNotesSection, ReadableNotesSection } from "./ItemNotesSections";

function AddedRowsView({
  document,
  onClose,
  onToast
}: {
  document: FinancialDocument | null;
  onClose: () => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [localLines, setLocalLines] = useState(() => document?.lines ?? []);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-white light:text-slate-950">
          ردیف‌های اضافه‌شده
        </h3>
        <p className="mt-1 text-sm leading-7 text-slate-300 light:text-slate-600">
          ردیف با موفقیت به صورت‌بها اضافه شد.
        </p>
      </div>
      <div className="space-y-2">
        {localLines.length === 0 ? (
          <p className="text-center text-sm text-slate-400 light:text-slate-500">
            هنوز ردیفی اضافه نشده است.
          </p>
        ) : null}
        {localLines.map((line) => (
          <div
            className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50"
            key={line.id}
          >
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-base font-bold text-slate-100 light:text-slate-900"
                title={cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
              >
                {cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300 light:text-slate-600">
                <span>
                  کد:{" "}
                  <span className="font-mono text-emerald-200 light:text-emerald-700">
                    {line.row_code_snapshot}
                  </span>
                </span>
                <span>مقدار: {formatDecimal(line.quantity)}</span>
                <span>جمع: {formatMoneyAmount(line.total_amount_snapshot)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                aria-label="ویرایش"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-400"
                onClick={() => onToast("ویرایش در نسخه بعدی")}
                title="ویرایش"
                type="button"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label="حذف"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                onClick={() =>
                  setLocalLines((current) => current.filter((item) => item.id !== line.id))
                }
                title="حذف از نمایش"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="w-full rounded-lg border border-white/10 bg-white/8 py-3 text-base font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-800"
        onClick={onClose}
        type="button"
      >
        بستن
      </button>
    </div>
  );
}

type CalculationStatus = "waiting" | "stale" | "calculating" | "ready" | "error";

type BuildCalculationPayloadResult =
  | { body: PricebookCalculateInputPayload; key: string; ok: true }
  | { message: string; ok: false };

function getBackendCustomPriceRequest(error: unknown): { rowCode: string | null } | null {
  if (!error || typeof error !== "object" || !("data" in error)) {
    return null;
  }

  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const requiresCustomPrice =
    record["requires_custom_price"] === true ||
    String(record["requires_custom_price"]).toLowerCase() === "true";

  if (!requiresCustomPrice) {
    return null;
  }

  const fallbackRowCode = record["fallback_row_code"];
  return {
    rowCode:
      typeof fallbackRowCode === "string" || typeof fallbackRowCode === "number"
        ? String(fallbackRowCode)
        : null
  };
}

type ModalHeaderProps = {
  action?: ReactNode;
  onClose: () => void;
  title: string;
};

function ModalHeader({ action, onClose, title }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur light:border-slate-200 light:bg-white/95">
      <button
        aria-label="بستن"
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
        onClick={onClose}
        title="بستن"
        type="button"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 className="min-w-0 flex-1 truncate text-right text-base font-black text-white light:text-slate-950">
        {title}
      </h2>
      <div className="flex min-w-[12rem] flex-wrap items-end justify-end gap-2">{action}</div>
    </div>
  );
}

function ItemDetailContent({
  coefficientSets,
  document,
  item,
  onClose,
  onDocumentUpdated,
  onSelectedCoefficientSetIdChange,
  onToast,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  item: PricebookItemDetail;
  onClose: () => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
  selectedCoefficientSetId: number | null;
}) {
  const itemType = classifyPricebookItem(item);
  const calculationInputs = useMemo(() => getCalculationInputs(item), [item]);
  const selectedRowInput = useMemo(() => getSelectedRowInput(item), [item]);
  const usesInputDrivenCalculation =
    itemType === "multi-input" || itemType === "range-based" || selectedRowInput !== null;

  const [quantity, setQuantity] = useState("");
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputErrors, setInputErrors] = useState<Record<string, string | null>>({});
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [manualUnitPriceError, setManualUnitPriceError] = useState<string | null>(null);
  const [rowSelectionError, setRowSelectionError] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<PricebookCalculateResponse | null>(null);
  const [calculationStatus, setCalculationStatus] = useState<CalculationStatus>("waiting");
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [isAddFlowCalculating, setIsAddFlowCalculating] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);
  const [lineSuccess, setLineSuccess] = useState<string | null>(null);
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [customPriceErrors, setCustomPriceErrors] = useState<Record<string, string | null>>({});
  const [editingRowCode, setEditingRowCode] = useState<string | null>(null);
  const [editingRowPrice, setEditingRowPrice] = useState("");
  const [customFallbackDraftPrice, setCustomFallbackDraftPrice] = useState("");
  const [backendFallbackRowCode, setBackendFallbackRowCode] = useState<string | null>(null);
  const [confirmedFootnotes, setConfirmedFootnotes] = useState<Record<string, boolean>>({});
  const [showAddedRows, setShowAddedRows] = useState(false);
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();

  const pendingAutoTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const latestRequestIdRef = useRef(0);
  const latestCalculatedPayloadKeyRef = useRef<string | null>(null);
  const inFlightPayloadKeyRef = useRef<string | null>(null);
  const calculationRef = useRef<PricebookCalculateResponse | null>(null);

  const requiresManualPrice = hasManualUnitPrice(item);
  const needsRowSelection = requiresRowSelection(item);
  const documentLocked = isFinancialDocumentLocked(document);
  const showItemizedPicker = itemType === "itemized" && selectedRowInput === null;
  const showRowPicker =
    needsRowSelection &&
    selectedRowInput === null &&
    itemType !== "range-based" &&
    !showItemizedPicker;
  const activeCustomPrices = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(customPrices).filter(
          ([rowCode, value]) => rowCode.trim() && isPositiveDecimal(value)
        )
      ),
    [customPrices]
  );

  useEffect(() => {
    calculationRef.current = calculation;
  }, [calculation]);

  const matchedRangeRow = useMemo(() => {
    if (itemType !== "range-based") return null;
    const priceRanges = parsePriceRanges(item.price_ranges);
    if (!priceRanges) return null;

    let drivingValue: string | null = null;
    if (calculationInputs.length > 0) {
      const drivingInput = calculationInputs
        .filter((input) => !isSelectInput(input))
        .find((input) => input.value_key === priceRanges.value_key);
      if (drivingInput) {
        const value = normalizeQuantityValue(inputValues[getInputStateKey(drivingInput)] ?? "");
        if (isPositiveDecimal(value)) drivingValue = value;
      }
    } else {
      const value = normalizeQuantityValue(quantity);
      if (isPositiveDecimal(value)) drivingValue = value;
    }

    if (drivingValue === null) return null;
    return findMatchedRangeRow(priceRanges, drivingValue, item.rows);
  }, [calculationInputs, inputValues, item.price_ranges, item.rows, itemType, quantity]);

  const hasDrivingValueForRange = useMemo(() => {
    if (itemType !== "range-based") return false;
    const priceRanges = parsePriceRanges(item.price_ranges);
    if (!priceRanges) return false;

    if (calculationInputs.length > 0) {
      const drivingInput = calculationInputs
        .filter((input) => !isSelectInput(input))
        .find((input) => input.value_key === priceRanges.value_key);
      if (!drivingInput) return false;
      return isPositiveDecimal(
        normalizeQuantityValue(inputValues[getInputStateKey(drivingInput)] ?? "")
      );
    }

    return isPositiveDecimal(normalizeQuantityValue(quantity));
  }, [calculationInputs, inputValues, item.price_ranges, itemType, quantity]);

  const rangeNumericInputsAreValid = useMemo(() => {
    if (itemType !== "range-based") return false;

    const numericInputs = calculationInputs
      .filter((input) => !isSelectInput(input))
      .sort((first, second) => first.value_key - second.value_key);

    if (numericInputs.length === 0) {
      return isPositiveDecimal(normalizeQuantityValue(quantity));
    }

    return numericInputs.every((input) => {
      const normalized = normalizeQuantityValue(inputValues[getInputStateKey(input)] ?? "");
      if (!isPositiveDecimal(normalized)) return false;
      if (
        input.min_value !== null &&
        input.min_value !== undefined &&
        Number(normalized) < Number(input.min_value)
      ) {
        return false;
      }
      if (
        input.max_value !== null &&
        input.max_value !== undefined &&
        Number(normalized) > Number(input.max_value)
      ) {
        return false;
      }
      return true;
    });
  }, [calculationInputs, inputValues, itemType, quantity]);

  const rangeFallbackRow = useMemo(
    () =>
      itemType === "range-based"
        ? getRangeFallbackRow(item, backendFallbackRowCode)
        : null,
    [backendFallbackRowCode, item, itemType]
  );

  const requiresCustomFallbackPrice =
    itemType === "range-based" &&
    rangeNumericInputsAreValid &&
    (backendFallbackRowCode !== null ||
      (hasDrivingValueForRange && matchedRangeRow === null)) &&
    rangeFallbackRow !== null;

  const rangeMatchError =
    itemType === "range-based" &&
    hasDrivingValueForRange &&
    matchedRangeRow === null &&
    !requiresCustomFallbackPrice
      ? "مقدار واردشده با هیچ بازه قیمتی تطابق ندارد."
      : null;

  const rowSelectionOptions = useMemo<CalculationRowSelectionOption[]>(() => {
    if (!showItemizedPicker && !showRowPicker) {
      return [];
    }

    return getSelectedRowOptions(item).flatMap((option) => {
      if (option.backendRowId === null) {
        return [];
      }

      return [
        {
          helper: option.helper,
          id: option.backendRowId,
          label: option.label
        }
      ];
    });
  }, [item, showItemizedPicker, showRowPicker]);

  const rowSelection =
    showItemizedPicker || showRowPicker
      ? {
          error: hasSubmitAttempted ? rowSelectionError : null,
          label: showItemizedPicker ? "انتخاب گزینه" : "انتخاب ردیف",
          onChange: (rowId: number | null) => {
            setSelectedRowId(rowId);
            setRowSelectionError(null);
            setHasSubmitAttempted(false);
            setCalculationError(null);
            setLineError(null);
          },
          options: rowSelectionOptions,
          placeholder: showItemizedPicker ? "گزینه را انتخاب کنید" : "ردیف را انتخاب کنید",
          value: selectedRowId
        }
      : undefined;

  const clearPendingAutoCalculation = useCallback(() => {
    if (pendingAutoTimerRef.current !== null) {
      window.clearTimeout(pendingAutoTimerRef.current);
      pendingAutoTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearPendingAutoCalculation();
      latestRequestIdRef.current += 1;
    },
    [clearPendingAutoCalculation]
  );

  const buildCalculationPayload = useCallback(
    (commitErrors: boolean): BuildCalculationPayloadResult => {
      const calculateBody: PricebookCalculateInputPayload = {};
      const nextInputErrors: Record<string, string | null> = {};
      const nextCustomPriceErrors: Record<string, string | null> = {};
      let nextQuantityError: string | null = null;
      let nextManualUnitPriceError: string | null = null;
      let nextRowSelectionError: string | null = null;

      function applyFailure(message: string): BuildCalculationPayloadResult {
        if (commitErrors) {
          setInputErrors(nextInputErrors);
          setQuantityError(nextQuantityError);
          setManualUnitPriceError(nextManualUnitPriceError);
          setRowSelectionError(nextRowSelectionError);
          setCustomPriceErrors((current) => ({ ...current, ...nextCustomPriceErrors }));
          setCalculationError(message);
        }
        return { message, ok: false };
      }

      function clearCommittedErrors() {
        if (!commitErrors) return;
        setInputErrors({});
        setQuantityError(null);
        setManualUnitPriceError(null);
        setRowSelectionError(null);
        setCustomPriceErrors({});
        setCalculationError(null);
      }

      function applySelectedRowInputs() {
        let hasError = false;

        for (const input of calculationInputs.filter((candidate) => isSelectInput(candidate))) {
          const inputKey = getInputStateKey(input);
          const selectedRowCode = inputValues[inputKey]?.trim() ?? "";
          const options = getSelectInputOptions(input, item);
          const selectedOption = options.find((option) => option.value === selectedRowCode);

          if (!selectedRowCode) {
            nextInputErrors[inputKey] = "ابتدا یک گزینه انتخاب کنید.";
            hasError = true;
            continue;
          }

          const backendRowId =
            selectedOption?.backendRowId ??
            resolveSelectedRowIdForBackend(selectedRowCode, item.rows);

          if (backendRowId === null) {
            nextInputErrors[inputKey] =
              "ردیف انتخاب‌شده در داده‌های آیتم پیدا نشد.";
            hasError = true;
            continue;
          }

          calculateBody.selected_row_id = backendRowId;
        }

        return hasError;
      }

      if (itemType === "multi-input" || (selectedRowInput !== null && itemType !== "range-based")) {
        const hasSelectedInputError = applySelectedRowInputs();
        let hasError = false;
        const numericInputs = [...calculationInputs]
          .filter((candidate) => !isSelectInput(candidate))
          .sort((first, second) => first.value_key - second.value_key);

        for (const input of numericInputs) {
          const inputKey = getInputStateKey(input);
          const normalized = normalizeQuantityValue(inputValues[inputKey] ?? "");
          if (!isPositiveDecimal(normalized)) {
            nextInputErrors[inputKey] = `${input.label_fa} باید یک عدد مثبت باشد.`;
            hasError = true;
            continue;
          }
          if (
            input.min_value !== null &&
            input.min_value !== undefined &&
            Number(normalized) < Number(input.min_value)
          ) {
            nextInputErrors[getInputStateKey(input)] = `حداقل مقدار ${input.label_fa}: ${input.min_value}`;
            hasError = true;
            continue;
          }
          if (
            input.max_value !== null &&
            input.max_value !== undefined &&
            Number(normalized) > Number(input.max_value)
          ) {
            nextInputErrors[getInputStateKey(input)] = `حداکثر مقدار ${input.label_fa}: ${input.max_value}`;
            hasError = true;
          }
        }
        if (hasError || hasSelectedInputError) {
          return applyFailure("ورودی‌های لازم را کامل و معتبر وارد کنید.");
        }

        const numericInputValues = numericInputs.map((input) =>
          normalizeQuantityValue(inputValues[getInputStateKey(input)] ?? "")
        );
        if (numericInputValues.length > 0) {
          calculateBody.values = numericInputValues;
        }
      } else if (itemType === "range-based") {
        if (calculationInputs.length > 0) {
          const hasSelectedInputError = applySelectedRowInputs();
          let hasError = false;
          const numericInputs = [...calculationInputs]
            .filter((candidate) => !isSelectInput(candidate))
            .sort((first, second) => first.value_key - second.value_key);

          for (const input of numericInputs) {
            const inputKey = getInputStateKey(input);
            const normalized = normalizeQuantityValue(inputValues[inputKey] ?? "");
            if (!isPositiveDecimal(normalized)) {
              nextInputErrors[inputKey] = `${input.label_fa} باید یک عدد مثبت باشد.`;
              hasError = true;
              continue;
            }
            if (
              input.min_value !== null &&
              input.min_value !== undefined &&
              Number(normalized) < Number(input.min_value)
            ) {
              nextInputErrors[inputKey] = `حداقل مقدار ${input.label_fa}: ${input.min_value}`;
              hasError = true;
              continue;
            }
            if (
              input.max_value !== null &&
              input.max_value !== undefined &&
              Number(normalized) > Number(input.max_value)
            ) {
              nextInputErrors[inputKey] = `حداکثر مقدار ${input.label_fa}: ${input.max_value}`;
              hasError = true;
            }
          }

          if (hasError || hasSelectedInputError) {
            return applyFailure("ورودی‌های لازم را کامل و معتبر وارد کنید.");
          }

          const numericInputValues = numericInputs.map((input) =>
            normalizeQuantityValue(inputValues[getInputStateKey(input)] ?? "")
          );
          if (numericInputValues.length > 0) {
            calculateBody.values = numericInputValues;
          }
        } else {
          const normalizedQuantity = normalizeQuantityValue(quantity);
          if (!isPositiveDecimal(normalizedQuantity)) {
            nextQuantityError = "مقدار باید یک عدد مثبت باشد.";
            return applyFailure("مقدار را وارد کنید تا ردیف بازه‌ای انتخاب شود.");
          }
          calculateBody.quantity = normalizedQuantity;
        }

        if (!matchedRangeRow) {
          if (requiresCustomFallbackPrice && rangeFallbackRow) {
            const fallbackCustomPrice = activeCustomPrices[rangeFallbackRow.row_code];

            if (!fallbackCustomPrice) {
              nextCustomPriceErrors[rangeFallbackRow.row_code] =
                "برای مقدار خارج از بازه، بهای واحد سفارشی لازم است.";
              return applyFailure(
                "برای مقدار خارج از بازه، بهای واحد سفارشی لازم است."
              );
            }
          } else {
            return applyFailure(
              hasDrivingValueForRange
                ? "مقدار واردشده با هیچ بازه قیمتی تطابق ندارد."
                : "مقدار را وارد کنید تا ردیف بازه‌ای انتخاب شود."
            );
          }
        } else {
          calculateBody.selected_row_id = matchedRangeRow.id;
        }
      } else {
        const normalizedQuantity = normalizeQuantityValue(quantity);
        if (!isPositiveDecimal(normalizedQuantity)) {
          nextQuantityError = "مقدار باید یک عدد مثبت باشد.";
          return applyFailure("مقدار باید یک عدد مثبت باشد.");
        }
        calculateBody.quantity = normalizedQuantity;
      }

      if (showRowPicker && selectedRowId === null) {
        nextRowSelectionError = "ابتدا یک ردیف انتخاب کنید.";
        return applyFailure("ابتدا یک ردیف از فهرست انتخاب کنید.");
      }

      if (showItemizedPicker && selectedRowId === null) {
        nextRowSelectionError = "ابتدا یک گزینه انتخاب کنید.";
        return applyFailure("ابتدا یک گزینه از فهرست انتخاب کنید.");
      }

      if (requiresManualPrice && !requiresCustomFallbackPrice) {
        const normalized = normalizeQuantityValue(manualUnitPrice);
        if (!isPositiveDecimal(normalized)) {
          nextManualUnitPriceError = "قیمت واحد باید یک عدد مثبت باشد.";
          return applyFailure("قیمت واحد باید یک عدد مثبت وارد شود.");
        }
        calculateBody.manual_unit_price = normalized;
      }

      if (selectedCoefficientSetId) {
        calculateBody.coefficient_set_id = selectedCoefficientSetId;
      }

      if (showRowPicker && selectedRowId !== null) {
        calculateBody.pricebook_row_id = selectedRowId;
      }

      if (showItemizedPicker && selectedRowId !== null) {
        calculateBody.selected_row_id = selectedRowId;
      }

      const selectedFootnotes = Object.fromEntries(
        Object.entries(confirmedFootnotes).filter(([, checked]) => checked)
      );
      if (Object.keys(selectedFootnotes).length > 0) {
        calculateBody.footnotes = selectedFootnotes;
      }
      if (Object.keys(activeCustomPrices).length > 0) {
        calculateBody.custom_prices = activeCustomPrices;
      }

      clearCommittedErrors();
      return { body: calculateBody, key: stablePayloadKey(calculateBody), ok: true };
    },
    [
      activeCustomPrices,
      calculationInputs,
      confirmedFootnotes,
      hasDrivingValueForRange,
      inputValues,
      item,
      itemType,
      manualUnitPrice,
      matchedRangeRow,
      quantity,
      rangeFallbackRow,
      requiresCustomFallbackPrice,
      requiresManualPrice,
      selectedCoefficientSetId,
      selectedRowId,
      selectedRowInput,
      showItemizedPicker,
      showRowPicker
    ]
  );

  const runCalculation = useCallback(
    async (
      payload: BuildCalculationPayloadResult,
      options: { forAdd?: boolean; force?: boolean } = {}
    ) => {
      if (!payload.ok) {
        setCalculationStatus("waiting");
        if (options.forAdd) {
          setCalculationError(payload.message);
        }
        return null;
      }

      if (
        !options.force &&
        payload.key === latestCalculatedPayloadKeyRef.current &&
        calculationRef.current
      ) {
        setCalculationStatus("ready");
        return calculationRef.current;
      }

      if (!options.force && inFlightPayloadKeyRef.current === payload.key) {
        return null;
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      inFlightPayloadKeyRef.current = payload.key;
      setIsAutoCalculating(true);
      setCalculationStatus("calculating");
      setCalculationError(null);
      if (options.forAdd) {
        setIsAddFlowCalculating(true);
      }

      try {
        const result = await calculatePricebookItem({
          body: payload.body,
          itemId: item.id
        }).unwrap();

        if (requestId !== latestRequestIdRef.current) {
          return null;
        }

        latestCalculatedPayloadKeyRef.current = payload.key;
        calculationRef.current = result;
        setCalculation(result);
        setCalculationStatus("ready");
        return result;
      } catch (error) {
        if (requestId === latestRequestIdRef.current) {
          const customPriceRequest = getBackendCustomPriceRequest(error);
          if (customPriceRequest) {
            const fallbackRowCode = customPriceRequest.rowCode ?? rangeFallbackRow?.row_code ?? null;
            setCalculation(null);
            calculationRef.current = null;
            latestCalculatedPayloadKeyRef.current = null;
            setCalculationStatus("waiting");
            setCalculationError(null);
            if (fallbackRowCode) {
              setBackendFallbackRowCode(fallbackRowCode);
              if (options.forAdd) {
                setCustomPriceErrors((current) => ({
                  ...current,
                  [fallbackRowCode]: "برای مقدار خارج از بازه، بهای واحد سفارشی لازم است."
                }));
              }
            }
            return null;
          }

          const message = getManualPriceValidationMessage(error);
          setCalculation(null);
          calculationRef.current = null;
          latestCalculatedPayloadKeyRef.current = null;
          setCalculationStatus("error");
          setCalculationError(message);
        }
        return null;
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsAutoCalculating(false);
          if (options.forAdd) {
            setIsAddFlowCalculating(false);
          }
          if (inFlightPayloadKeyRef.current === payload.key) {
            inFlightPayloadKeyRef.current = null;
          }
        }
      }
    },
    [calculatePricebookItem, item.id, rangeFallbackRow?.row_code]
  );

  useEffect(() => {
    if (showAddedRows) return undefined;

    clearPendingAutoCalculation();
    const payload = buildCalculationPayload(false);

    if (!payload.ok) {
      setCalculation(null);
      calculationRef.current = null;
      latestCalculatedPayloadKeyRef.current = null;
      setCalculationStatus("waiting");
      setCalculationError(null);
      return undefined;
    }

    if (
      payload.key === latestCalculatedPayloadKeyRef.current &&
      calculationRef.current !== null
    ) {
      setCalculationStatus("ready");
      return undefined;
    }

    setCalculation(null);
    calculationRef.current = null;
    setCalculationStatus("stale");
    setCalculationError(null);
    pendingAutoTimerRef.current = window.setTimeout(() => {
      void runCalculation(payload);
    }, 500);

    return clearPendingAutoCalculation;
  }, [buildCalculationPayload, clearPendingAutoCalculation, runCalculation, showAddedRows]);

  const handleInputValueChange = useCallback((key: string, value: string) => {
    setInputValues((current) => ({ ...current, [key]: value }));
    setInputErrors((current) => ({ ...current, [key]: null }));
    setBackendFallbackRowCode(null);
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);
  }, []);

  const handleQuantityChange = useCallback((value: string) => {
    setQuantity(value);
    setQuantityError(null);
    setBackendFallbackRowCode(null);
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);
  }, []);

  const handleManualUnitPriceChange = useCallback((value: string) => {
    setManualUnitPrice(value);
    setManualUnitPriceError(null);
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);
  }, []);

  const handleCustomFallbackPriceChange = useCallback((rowCode: string, value: string) => {
    const normalized = normalizeQuantityValue(value);

    setCustomFallbackDraftPrice(value);
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);

    if (!value.trim() || !isPositiveDecimal(normalized)) {
      setCustomPrices((current) => {
        const next = { ...current };
        delete next[rowCode];
        return next;
      });
      return;
    }

    setCustomPrices((current) => ({ ...current, [rowCode]: normalized }));
  }, []);

  const handleAddLine = useCallback(async () => {
    setHasSubmitAttempted(true);
    setLineError(null);
    setLineSuccess(null);

    if (!document) {
      setLineError("سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید.");
      return;
    }

    if (documentLocked) {
      setLineError("این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد.");
      return;
    }

    const payload = buildCalculationPayload(true);
    if (!payload.ok) {
      setCalculation(null);
      calculationRef.current = null;
      latestCalculatedPayloadKeyRef.current = null;
      setCalculationStatus("waiting");
      return;
    }

    clearPendingAutoCalculation();

    const effectiveCalculation =
      payload.key === latestCalculatedPayloadKeyRef.current && calculationRef.current
        ? calculationRef.current
        : await runCalculation(payload, { forAdd: true, force: true });

    if (!effectiveCalculation) {
      return;
    }

    const lineBody: FinancialDocumentLineCreatePayload = {
      pricebook_item_id: item.id,
      quantity: effectiveCalculation.quantity
    };

    if (payload.body.manual_unit_price !== undefined && payload.body.manual_unit_price !== null) {
      lineBody.manual_unit_price = payload.body.manual_unit_price;
    }
    if (payload.body.values !== undefined) {
      lineBody.values = payload.body.values;
    }
    if (payload.body.pricebook_row_id !== undefined && payload.body.pricebook_row_id !== null) {
      lineBody.pricebook_row_id = payload.body.pricebook_row_id;
    }
    if (payload.body.selected_row_id !== undefined && payload.body.selected_row_id !== null) {
      lineBody.selected_row_id = payload.body.selected_row_id;
    }
    if (
      payload.body.coefficient_set_id !== undefined &&
      payload.body.coefficient_set_id !== null
    ) {
      lineBody.coefficient_set_id = payload.body.coefficient_set_id;
    }
    if (payload.body.footnotes !== undefined && payload.body.footnotes !== null) {
      lineBody.footnotes = payload.body.footnotes;
    }
    if (payload.body.custom_prices !== undefined && payload.body.custom_prices !== null) {
      lineBody.custom_prices = payload.body.custom_prices;
    }

    try {
      await createFinancialDocumentLine({
        body: lineBody,
        documentId: document.id
      }).unwrap();
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setHasSubmitAttempted(false);
      onToast("ردیف به صورت‌بها اضافه شد.", "success");
      setShowAddedRows(true);
    } catch (error) {
      const msg = getManualPriceValidationMessage(error);
      setLineError(msg);
      if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: unknown }).data === "object"
      ) {
        const d = (error as { data: Record<string, unknown> }).data;
        if (
          d["requires_row_selection"] === true ||
          String(d["requires_row_selection"]) === "True"
        ) {
          onToast("این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید.", "error");
        }
      }
    }
  }, [
    buildCalculationPayload,
    clearPendingAutoCalculation,
    createFinancialDocumentLine,
    document,
    documentLocked,
    item.id,
    onDocumentUpdated,
    onToast,
    recalculateFinancialDocument,
    runCalculation
  ]);

  const handleSelectedCoefficientSetIdChange = useCallback(
    (setId: number | null) => {
      setHasSubmitAttempted(false);
      setCalculationError(null);
      setLineError(null);
      onSelectedCoefficientSetIdChange(setId);
    },
    [onSelectedCoefficientSetIdChange]
  );

  function beginRowPriceEdit(row: PricebookItemDetail["rows"][number]) {
    if (documentLocked || isAddingLine) {
      return;
    }

    const rowCode = row.row_code;
    setEditingRowCode(rowCode);
    setEditingRowPrice(customPrices[rowCode] ?? row.unit_price ?? "");
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
    setCalculationError(null);
    setLineError(null);
  }

  function handleEditingRowPriceChange(rowCode: string, value: string) {
    setEditingRowPrice(value);
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
  }

  function cancelRowPriceEdit(rowCode: string) {
    setEditingRowCode(null);
    setEditingRowPrice("");
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
  }

  function applyRowCustomPrice(rowCode: string) {
    const normalized = normalizeQuantityValue(editingRowPrice);

    if (!isPositiveDecimal(normalized)) {
      setCustomPriceErrors((current) => ({
        ...current,
        [rowCode]: "قیمت دستی باید یک عدد مثبت باشد."
      }));
      return;
    }

    setCustomPrices((current) => ({ ...current, [rowCode]: normalized }));
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
    setEditingRowCode(null);
    setEditingRowPrice("");
    if (rangeFallbackRow?.row_code === rowCode) {
      setCustomFallbackDraftPrice("");
    }
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);
  }

  function resetRowCustomPrice(rowCode: string) {
    setCustomPrices((current) => {
      const next = { ...current };
      delete next[rowCode];
      return next;
    });
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
    if (editingRowCode === rowCode) {
      setEditingRowCode(null);
      setEditingRowPrice("");
    }
    if (rangeFallbackRow?.row_code === rowCode) {
      setCustomFallbackDraftPrice("");
    }
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);
  }

  const currentPayload = buildCalculationPayload(false);
  const isCalculating = isAutoCalculating || calculateState.isLoading;
  const isAddingLine =
    isAddFlowCalculating || createLineState.isLoading || recalculateState.isLoading;
  const fallbackCustomPriceValue = rangeFallbackRow
    ? customFallbackDraftPrice || customPrices[rangeFallbackRow.row_code] || ""
    : "";
  const hasFallbackCustomPrice = Boolean(
    rangeFallbackRow && activeCustomPrices[rangeFallbackRow.row_code]
  );
  const needsFallbackCustomPrice = requiresCustomFallbackPrice && !hasFallbackCustomPrice;
  const addLineDisabledReason = !document
    ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
    : documentLocked
      ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
      : null;

  const baseCalculationStatusLabel =
    calculationStatus === "calculating"
      ? isAddFlowCalculating
        ? "در حال محاسبه نهایی پیش از افزودن..."
        : "در حال محاسبه خودکار..."
      : !currentPayload.ok
        ? "در انتظار تکمیل ورودی‌های لازم."
        : calculationStatus === "ready" && calculation
          ? "محاسبه با آخرین ورودی‌ها به‌روز است."
          : calculationStatus === "error"
            ? "محاسبه ناموفق بود؛ ورودی‌ها را بررسی کنید."
            : calculationStatus === "stale"
              ? "ورودی‌ها تغییر کرده‌اند؛ محاسبه خودکار در صف است."
              : "پس از تکمیل ورودی‌ها، محاسبه به صورت خودکار انجام می‌شود.";

  const calculationStatusLabel =
    calculationStatus === "calculating" && requiresCustomFallbackPrice && !isAddFlowCalculating
      ? "در حال محاسبه با قیمت سفارشی..."
      : needsFallbackCustomPrice
        ? "این مقدار خارج از بازه فهرست‌بهاست؛ بهای واحد سفارشی وارد کنید."
        : calculationStatus === "ready" && calculation && requiresCustomFallbackPrice
          ? "محاسبه با بهای واحد سفارشی انجام شد."
          : baseCalculationStatusLabel;

  const headerAction = (
    <div className="flex flex-wrap items-end justify-end gap-2">
      <label className="space-y-1">
        <span className="block text-xs font-bold text-slate-400 light:text-slate-500">
          ضرایب
        </span>
        <select
          className={classNames(inputClasses, "h-10 w-36 px-2 text-xs sm:w-44")}
          disabled={isAddingLine}
          onChange={(event) =>
            handleSelectedCoefficientSetIdChange(
              event.target.value ? Number(event.target.value) : null
            )
          }
          title={
            coefficientSets.length === 0
              ? "برای ساخت مجموعه ضرایب به مرحله ضرایب بروید."
              : undefined
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
      <Button
        className="min-w-28 px-4"
        disabled={Boolean(addLineDisabledReason) || isAddingLine}
        onClick={handleAddLine}
        type="button"
      >
        {isAddingLine ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        افزودن
      </Button>
    </div>
  );

  if (showAddedRows) {
    return (
      <div className="flex max-h-[85dvh] flex-col">
        <ModalHeader onClose={onClose} title={item.short_name_fa ?? "جزئیات آیتم"} />
        <div className="overflow-y-auto p-4">
          <AddedRowsView document={document} onClose={onClose} onToast={onToast} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[85dvh] flex-col">
      <ModalHeader action={headerAction} onClose={onClose} title={item.short_name_fa ?? "جزئیات آیتم"} />
      <div className="space-y-3 overflow-y-auto p-4">
        {item.description_fa ? (
          <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
            {item.description_fa}
          </p>
        ) : null}

        {addLineDisabledReason ? (
          <p className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-sm leading-7 text-amber-100 light:text-amber-800">
            {addLineDisabledReason}
          </p>
        ) : null}

        {coefficientSets.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/7 p-3 text-sm leading-7 text-slate-300 light:border-slate-200 light:bg-white light:text-slate-600">
            برای محاسبه با ضریب، در مرحله ضرایب یک مجموعه ضریب بسازید. تا آن زمان گزینه بدون ضریب استفاده می‌شود.
          </p>
        ) : null}

        <CalculationSection
          calculation={calculation}
          calculationError={
            calculationStatus === "error" ? calculationError : hasSubmitAttempted ? calculationError : null
          }
          calculationStatusLabel={calculationStatusLabel}
          customFallbackPrice={
            requiresCustomFallbackPrice && rangeFallbackRow
              ? {
                  error: customPriceErrors[rangeFallbackRow.row_code] ?? null,
                  officialUnitPrice: rangeFallbackRow.unit_price,
                  onChange: (value) =>
                    handleCustomFallbackPriceChange(rangeFallbackRow.row_code, value),
                  rowCode: rangeFallbackRow.row_code,
                  title:
                    rangeFallbackRow.title_fa ||
                    rangeFallbackRow.short_title_fa ||
                    rangeFallbackRow.description_fa ||
                    "ردیف اصلی",
                  unit: rangeFallbackRow.unit,
                  value: fallbackCustomPriceValue
                }
              : undefined
          }
          customPriceRowCodes={Object.keys(activeCustomPrices)}
          inputErrors={
            hasSubmitAttempted && usesInputDrivenCalculation ? inputErrors : undefined
          }
          inputs={
            usesInputDrivenCalculation
              ? calculationInputs.length > 0
                ? calculationInputs
                : undefined
              : undefined
          }
          inputValues={usesInputDrivenCalculation ? inputValues : undefined}
          isAddingLine={isAddingLine}
          isCalculating={isCalculating}
          isRangeBased={itemType === "range-based"}
          item={item}
          itemRows={item.rows}
          lineError={lineError}
          lineSuccess={lineSuccess}
          manualUnitPrice={manualUnitPrice}
          manualUnitPriceError={hasSubmitAttempted ? manualUnitPriceError : null}
          matchedRangeRow={itemType === "range-based" ? matchedRangeRow : undefined}
          onAddLine={handleAddLine}
          onInputValueChange={
            usesInputDrivenCalculation ? handleInputValueChange : undefined
          }
          quantity={quantity}
          quantityError={hasSubmitAttempted ? quantityError : null}
          rangeMatchError={hasSubmitAttempted && itemType === "range-based" ? rangeMatchError : undefined}
          requiresManualPrice={requiresManualPrice}
          requiresRowSelection={needsRowSelection || selectedRowInput !== null}
          rowSelection={rowSelection}
          setManualUnitPrice={handleManualUnitPriceChange}
          setQuantity={handleQuantityChange}
          unit={item.unit || undefined}
        />

        <ChecklistNotesSection
          disabled={isAddingLine}
          notes={item.footnotes}
          onToggle={(noteCode, checked) => {
            setConfirmedFootnotes((current) => ({ ...current, [noteCode]: checked }));
            setHasSubmitAttempted(false);
            setCalculationError(null);
            setLineError(null);
          }}
          selectedNotes={confirmedFootnotes}
        />

        {item.rows.length > 0 ? (
          <section>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">
              ردیف فهرست‌بها
            </h3>
            <div className="mt-2 space-y-2">
              {item.rows.map((row) => {
                const customPrice = customPrices[row.row_code];
                const hasCustomPrice = Boolean(customPrice);
                const hasOfficialPrice =
                  row.unit_price !== null &&
                  row.unit_price !== undefined &&
                  String(row.unit_price).trim() !== "";
                const officialPriceLabel = hasOfficialPrice
                  ? formatMoneyAmount(row.unit_price)
                  : "بدون قیمت رسمی";
                const isEditing = editingRowCode === row.row_code;
                const priceControlsDisabled = documentLocked || isAddingLine;

                return (
                <div
                  className="rounded-lg border border-white/10 bg-white/7 px-3 py-2 text-sm light:border-slate-200 light:bg-slate-50"
                  key={row.id}
                >
                  <div className="grid gap-x-3 gap-y-2 md:grid-cols-[6rem_minmax(0,1fr)_5rem_minmax(13rem,auto)] md:items-center">
                    <span className="font-mono font-bold text-emerald-200 light:text-emerald-700">
                      {row.row_code}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-100 light:text-slate-800">
                        {row.title_fa || row.short_title_fa}
                      </p>
                      {row.description_fa ? (
                        <p className="mt-0.5 truncate text-xs text-slate-400 light:text-slate-500">
                          {row.description_fa}
                        </p>
                      ) : null}
                      {(row.min_value || row.max_value) ? (
                        <p className="mt-0.5 text-xs text-slate-500 light:text-slate-500">
                          {row.min_value ? `از: ${formatDecimal(row.min_value)}` : null}
                          {row.min_value && row.max_value ? " / " : null}
                          {row.max_value ? `تا: ${formatDecimal(row.max_value)}` : null}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-slate-400 light:text-slate-500">{row.unit}</span>
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 md:justify-end">
                      {isEditing ? (
                        <>
                          <input
                            aria-label="بهای واحد"
                            className="h-8 w-32 rounded-md border border-white/10 bg-slate-950/45 px-2 text-left text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 light:border-slate-200 light:bg-white light:text-slate-950"
                            dir="ltr"
                            disabled={priceControlsDisabled}
                            inputMode="decimal"
                            onChange={(event) =>
                              handleEditingRowPriceChange(row.row_code, event.target.value)
                            }
                            placeholder={hasOfficialPrice ? String(row.unit_price) : "بهای واحد"}
                            value={editingRowPrice}
                          />
                          <button
                            aria-label="ثبت بهای واحد"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-200 transition hover:bg-emerald-400/10 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 light:text-emerald-700 light:hover:bg-emerald-50"
                            disabled={priceControlsDisabled}
                            onClick={() => applyRowCustomPrice(row.row_code)}
                            title="ثبت بهای واحد"
                            type="button"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="لغو ویرایش بهای واحد"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
                            disabled={priceControlsDisabled}
                            onClick={() => cancelRowPriceEdit(row.row_code)}
                            title="لغو"
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className={classNames(
                              "rounded-full border px-2 py-0.5 text-xs font-bold",
                              hasCustomPrice
                                ? "border-amber-300/35 bg-amber-400/15 text-amber-100 light:text-amber-800"
                                : "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 light:text-emerald-800"
                            )}
                          >
                            {hasCustomPrice ? "قیمت دستی" : "قیمت رسمی"}
                          </span>
                          <span className="font-bold text-slate-200 light:text-slate-800">
                            {hasCustomPrice ? formatMoneyAmount(customPrice) : officialPriceLabel}
                          </span>
                          {hasCustomPrice ? (
                            <span className="text-xs text-slate-400 light:text-slate-500">
                              رسمی: {officialPriceLabel}
                            </span>
                          ) : null}
                          <button
                            aria-label="ویرایش بهای واحد"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
                            disabled={priceControlsDisabled}
                            onClick={() => beginRowPriceEdit(row)}
                            title="ویرایش بهای واحد"
                            type="button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        {hasCustomPrice ? (
                          <button
                            aria-label="بازگشت به قیمت رسمی"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
                            disabled={priceControlsDisabled}
                            onClick={() => resetRowCustomPrice(row.row_code)}
                            title="بازگشت به قیمت رسمی"
                            type="button"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                        </>
                      )}
                    </div>
                  </div>
                  {customPriceErrors[row.row_code] ? (
                    <p className="mt-1 text-xs text-rose-300 light:text-rose-700">
                      {customPriceErrors[row.row_code]}
                    </p>
                  ) : null}
                </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <ReadableNotesSection notes={item.requirements} title="الزامات" />
      </div>
    </div>
  );
}

export function ItemDetailModal({
  coefficientSets,
  document,
  itemId,
  onClose,
  onDocumentUpdated,
  onSelectedCoefficientSetIdChange,
  onToast,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  itemId: number;
  onClose: () => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
  selectedCoefficientSetId: number | null;
}) {
  const { data: item, error, isLoading } = useRetrievePricebookItemQuery(itemId);
  const { secondaryNav } = useAppShell();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={classNames(
        "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4",
        secondaryNav ? "lg:right-[19rem]" : "lg:right-20"
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl light:border-slate-200 light:bg-white"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {item ? (
          <ItemDetailContent
            coefficientSets={coefficientSets}
            document={document}
            item={item}
            onClose={onClose}
            onDocumentUpdated={onDocumentUpdated}
            onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
            onToast={onToast}
            selectedCoefficientSetId={selectedCoefficientSetId}
          />
        ) : (
          <div className="flex max-h-[85dvh] flex-col">
            <ModalHeader onClose={onClose} title="جزئیات آیتم" />
            <div className="overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
                  در حال دریافت جزئیات آیتم
                </div>
              ) : null}

              {error ? (
                <EmptyState
                  description={getApiErrorMessage(error)}
                  icon={<XCircle className="h-7 w-7" />}
                  title="دریافت جزئیات آیتم ناموفق بود"
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
