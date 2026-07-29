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
import {
  createLineIdempotencyKey,
  formatInsufficientBalanceMessage,
  isIdempotencyKeyReused,
  isInsufficientTokenBalance
} from "../../wallet/walletApi";
import { Button } from "../../../shared/components/Button";
import { EmptyState } from "../../../shared/components/EmptyState";
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { classNames } from "../../../shared/utils/classNames";
import { inputClasses } from "../constants";
import {
  classifyPricebookItem,
  buildFootnotesPayload,
  findMatchedRangeRow,
  getActiveCalculationRows,
  getCalculationInputs,
  getInputStateKey,
  getLineDisplayRows,
  hasPositiveMoneyValue,
  getRangeFallbackRow,
  getSelectInputOptions,
  getSelectedRowInput,
  getSelectedRowOptions,
  getManualPriceValidationMessage,
  hasManualUnitPrice,
  isMainNumericInput,
  isSelectInput,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue,
  parsePriceRanges,
  resolveSelectedRowIdForBackend,
  requiresRowSelection,
  shouldValidateInputAgainstMainValue,
  stablePayloadKey,
  validateFootnoteInputs,
  validateNumericInput
} from "../costReportUtils";
import type { FootnoteInputErrors, FootnoteInputValues, TouchedFootnoteInputs } from "../costReportUtils";
import {
  CalculationSection,
  type CalculationRowSelectionOption,
  type CalculationStatusDotState
} from "./CalculationSection";
import { ChecklistNotesSection, ReadableNotesSection } from "./ItemNotesSections";

function AddedRowsView({
  lines,
  onClose,
  onToast
}: {
  lines: FinancialDocument["lines"];
  onClose: () => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [localLines, setLocalLines] = useState(() => lines);
  const displayGroups = localLines.map((line) => ({
    line,
    rows: getLineDisplayRows(line)
  }));
  const displayRowCount = displayGroups.reduce((sum, group) => sum + group.rows.length, 0);
  const hasMultipleRows = displayRowCount > 1;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-white light:text-slate-950">
          ردیف‌های اضافه‌شده
        </h3>
        <p className="mt-1 text-sm leading-7 text-slate-300 light:text-slate-600">
          {hasMultipleRows
            ? "ردیف‌ها با موفقیت به صورت‌بها اضافه شدند."
            : "ردیف با موفقیت به صورت‌بها اضافه شد."}
        </p>
        {hasMultipleRows ? (
          <p className="mt-1 text-xs font-bold text-emerald-200 light:text-emerald-700">
            {formatDecimal(displayRowCount)} ردیف اضافه شد
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        {localLines.length === 0 ? (
          <p className="text-center text-sm text-slate-400 light:text-slate-500">
            هنوز ردیفی اضافه نشده است.
          </p>
        ) : null}
        {displayGroups.map(({ line, rows }) => (
          <div
            className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50"
            key={line.id}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-base font-bold text-slate-100 light:text-slate-900"
                  title={cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                >
                  {cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                </p>
                {rows.length > 1 ? (
                  <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                    {formatDecimal(rows.length)} ردیف محاسبه‌شده
                  </p>
                ) : null}
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

            <div className="mt-3 space-y-2">
              {rows.map((row, index) => (
                <div
                  className="grid gap-2 rounded-lg border border-white/10 bg-slate-950/25 p-3 text-sm light:border-slate-200 light:bg-white sm:grid-cols-[6rem_1fr_7rem_8rem] sm:items-center"
                  key={`${row.parentLineId}-${row.rowCode ?? "row"}-${index}`}
                >
                  <span className="font-mono font-bold text-emerald-200 light:text-emerald-700">
                    {row.rowCode ?? "—"}
                  </span>
                  <span
                    className="min-w-0 truncate text-slate-100 light:text-slate-900"
                    title={cleanDisplayText(row.title, "شرح ثبت نشده")}
                  >
                    {cleanDisplayText(row.title, "شرح ثبت نشده")}
                  </span>
                  <span className="text-slate-400 light:text-slate-500">
                    {formatDecimal(row.quantity)} {cleanDisplayText(row.unit, "")}
                  </span>
                  <span className="font-bold text-slate-200 light:text-slate-800">
                    {formatMoneyAmount(row.total)}
                  </span>
                  <span className="text-xs text-slate-500 light:text-slate-500 sm:col-start-4">
                    {row.isStarredPrice ? "★ ستاره‌دار · " : "قیمت رسمی · "}
                    بهای واحد: {hasPositiveMoneyValue(row.unitPrice) ? formatMoneyAmount(row.unitPrice) : "-"}
                  </span>
                </div>
              ))}
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

function getBackendMissingStarredPrices(error: unknown): string[] | null {
  if (!error || typeof error !== "object" || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (record["requires_starred_prices"] !== true) return null;
  const missing = Array.isArray(record["missing_starred_prices"])
    ? record["missing_starred_prices"]
    : [];
  return missing
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const rowCode = (entry as Record<string, unknown>)["row_code"];
      return typeof rowCode === "string" || typeof rowCode === "number" ? String(rowCode) : null;
    })
    .filter((rowCode): rowCode is string => rowCode !== null);
}

function getBackendFootnoteInputError(error: unknown) {
  if (!error || typeof error !== "object" || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (record["requires_footnote_input"] !== true) return null;
  const footnoteId = record["footnote_id"];
  const field = record["field"];
  if (typeof footnoteId !== "string" || typeof field !== "string") return null;
  return {
    detail: typeof record["detail"] === "string" ? record["detail"] : "مقدار این تبصره معتبر نیست.",
    field,
    footnoteId
  };
}

type ModalHeaderProps = {
  action?: ReactNode;
  onClose: () => void;
  title: string;
};

function ModalHeader({ action, onClose, title }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-white/10 bg-slate-950/95 p-3 backdrop-blur light:border-slate-200 light:bg-white/95 sm:flex sm:flex-nowrap sm:gap-3 sm:p-4">
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
      <div className="col-span-2 flex min-w-0 w-full flex-wrap items-end justify-end gap-2 sm:col-auto sm:w-auto sm:min-w-[12rem]">{action}</div>
    </div>
  );
}

function getCompactRowDescription(title: string, description?: string | null): string | null {
  const normalizedTitle = title.replace(/\s+/g, " ").trim();
  const normalizedDescription = description?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalizedDescription || normalizedDescription === normalizedTitle) {
    return null;
  }

  if (normalizedTitle && normalizedDescription.startsWith(normalizedTitle)) {
    const shortened = normalizedDescription
      .slice(normalizedTitle.length)
      .replace(/^[\s،,:؛;.\-–—]+/, "")
      .trim();

    return shortened.length > 10 ? shortened : null;
  }

  return normalizedDescription;
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
  const [backendFallbackRowCode, setBackendFallbackRowCode] = useState<string | null>(null);
  const [missingStarredRowCodes, setMissingStarredRowCodes] = useState<string[]>([]);
  const [missingStarredDraftPrices, setMissingStarredDraftPrices] = useState<Record<string, string>>({});
  const [guidedMissingRowCode, setGuidedMissingRowCode] = useState<string | null>(null);
  const [confirmedFootnotes, setConfirmedFootnotes] = useState<Record<string, boolean>>({});
  const [footnoteInputValues, setFootnoteInputValues] = useState<FootnoteInputValues>({});
  const [footnoteInputErrors, setFootnoteInputErrors] = useState<FootnoteInputErrors>({});
  const [touchedFootnoteInputs, setTouchedFootnoteInputs] = useState<TouchedFootnoteInputs>({});
  const [showAddedRows, setShowAddedRows] = useState(false);
  const [addedRowsLines, setAddedRowsLines] = useState<FinancialDocument["lines"]>([]);
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();

  const pendingAutoTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const latestRequestIdRef = useRef(0);
  const latestCalculatedPayloadKeyRef = useRef<string | null>(null);
  const inFlightPayloadKeyRef = useRef<string | null>(null);
  const calculationRef = useRef<PricebookCalculateResponse | null>(null);
  const rowsSectionRef = useRef<HTMLElement | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rowPriceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lastGuidedMissingSetRef = useRef("");
  const missingStarredRowCodesRef = useRef<string[]>([]);
  // Retry key per payload: reusing it lets the backend replay instead of double-charging.
  const idempotencyRef = useRef<{ payloadKey: string; key: string } | null>(null);

  const revealMissingStarredPrices = useCallback((rowCodes: string[], forceGuide = false) => {
    const uniqueCodes = [...new Set(rowCodes)];
    const previousCodes = missingStarredRowCodesRef.current;
    missingStarredRowCodesRef.current = uniqueCodes;
    setMissingStarredRowCodes(uniqueCodes);
    setMissingStarredDraftPrices((current) => ({
      ...current,
      ...Object.fromEntries(uniqueCodes.map((rowCode) => [rowCode, current[rowCode] ?? ""]))
    }));
    setCustomPriceErrors((current) => {
      const next = { ...current };
      previousCodes.forEach((rowCode) => {
        if (!uniqueCodes.includes(rowCode) && next[rowCode] === "باید قیمت را تعیین کنید") {
          next[rowCode] = null;
        }
      });
      uniqueCodes.forEach((rowCode) => {
        next[rowCode] = "باید قیمت را تعیین کنید";
      });
      return next;
    });
    const firstCode = uniqueCodes.find((rowCode) => !isPositiveDecimal(customPrices[rowCode] ?? ""));
    if (!firstCode) return;
    const missingSetKey = uniqueCodes.slice().sort().join("\u0000");
    if (!forceGuide && lastGuidedMissingSetRef.current === missingSetKey) return;
    lastGuidedMissingSetRef.current = missingSetKey;
    setGuidedMissingRowCode(firstCode);
    window.setTimeout(() => {
      const container = modalScrollRef.current;
      const row = rowRefs.current[firstCode];
      if (!container || !row) return;
      const containerRect = container.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const targetTop = container.scrollTop + rowRect.top - containerRect.top
        - Math.max(12, (container.clientHeight - rowRect.height) / 2);
      container.scrollTo({ behavior: "smooth", top: Math.max(0, targetTop) });
    }, 0);
  }, [customPrices]);

  const usesRowSpecificPriceInputs = item.rows.length > 0;
  const requiresManualPrice = hasManualUnitPrice(item) && !usesRowSpecificPriceInputs;
  const needsRowSelection = requiresRowSelection(item);
  const documentLocked = isFinancialDocumentLocked(document);
  const showItemizedPicker = itemType === "itemized" && selectedRowInput === null;
  const showRowPicker =
    needsRowSelection &&
    selectedRowInput === null &&
    itemType !== "range-based" &&
    !showItemizedPicker;
  const numericCalculationInputs = useMemo(
    () =>
      calculationInputs
        .filter((input) => !isSelectInput(input))
        .sort((first, second) => (first.value_key ?? 0) - (second.value_key ?? 0)),
    [calculationInputs]
  );
  const mainNumericInput = useMemo(
    () => numericCalculationInputs.find(isMainNumericInput) ?? null,
    [numericCalculationInputs]
  );
  const mainNumericValue = mainNumericInput
    ? inputValues[getInputStateKey(mainNumericInput)] ?? ""
    : null;
  const activeCustomPrices = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(customPrices).filter(
          ([rowCode, value]) => rowCode.trim() && isPositiveDecimal(value)
        )
      ),
    [customPrices]
  );
  const activeCustomPriceRowCodes = useMemo(
    () => Object.keys(activeCustomPrices),
    [activeCustomPrices]
  );
  const activeCalculationRowsByCode = useMemo(
    () =>
      new Map(
        getActiveCalculationRows(calculation, item.rows, activeCustomPriceRowCodes)
          .filter((row) => row.rowCode)
          .map((row) => [row.rowCode as string, row])
      ),
    [activeCustomPriceRowCodes, calculation, item.rows]
  );

  useEffect(() => {
    calculationRef.current = calculation;
  }, [calculation]);

  const matchedRangeRow = useMemo(() => {
    if (itemType !== "range-based") return null;
    const priceRanges = parsePriceRanges(item.price_ranges);
    if (!priceRanges) return null;

    let drivingValue: string | null = null;
    if (numericCalculationInputs.length > 0) {
      const drivingInput = numericCalculationInputs.find(
        (input) => input.value_key === priceRanges.value_key
      );
      if (drivingInput) {
        const validation = validateNumericInput(
          drivingInput,
          inputValues[getInputStateKey(drivingInput)] ?? "",
          {
            mainValue: mainNumericValue,
            requireNotGreaterThanMain: shouldValidateInputAgainstMainValue(
              drivingInput,
              mainNumericInput
            )
          }
        );
        if (validation.ok) drivingValue = validation.value;
      }
    } else {
      const value = normalizeQuantityValue(quantity);
      if (isPositiveDecimal(value)) drivingValue = value;
    }

    if (drivingValue === null) return null;
    return findMatchedRangeRow(priceRanges, drivingValue, item.rows);
  }, [
    inputValues,
    item.price_ranges,
    item.rows,
    itemType,
    mainNumericInput,
    mainNumericValue,
    numericCalculationInputs,
    quantity
  ]);

  const hasDrivingValueForRange = useMemo(() => {
    if (itemType !== "range-based") return false;
    const priceRanges = parsePriceRanges(item.price_ranges);
    if (!priceRanges) return false;

    if (numericCalculationInputs.length > 0) {
      const drivingInput = numericCalculationInputs.find(
        (input) => input.value_key === priceRanges.value_key
      );
      if (!drivingInput) return false;
      const validation = validateNumericInput(
        drivingInput,
        inputValues[getInputStateKey(drivingInput)] ?? "",
        {
          mainValue: mainNumericValue,
          requireNotGreaterThanMain: shouldValidateInputAgainstMainValue(
            drivingInput,
            mainNumericInput
          )
        }
      );
      return validation.ok;
    }

    return isPositiveDecimal(normalizeQuantityValue(quantity));
  }, [
    inputValues,
    item.price_ranges,
    itemType,
    mainNumericInput,
    mainNumericValue,
    numericCalculationInputs,
    quantity
  ]);

  const rangeNumericInputsAreValid = useMemo(() => {
    if (itemType !== "range-based") return false;

    if (numericCalculationInputs.length === 0) {
      return isPositiveDecimal(normalizeQuantityValue(quantity));
    }

    return numericCalculationInputs.every((input) => {
      const validation = validateNumericInput(
        input,
        inputValues[getInputStateKey(input)] ?? "",
        {
          mainValue: mainNumericValue,
          requireNotGreaterThanMain: shouldValidateInputAgainstMainValue(
            input,
            mainNumericInput
          )
        }
      );
      return validation.ok;
    });
  }, [
    inputValues,
    itemType,
    mainNumericInput,
    mainNumericValue,
    numericCalculationInputs,
    quantity
  ]);

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
      const footnoteValidation = validateFootnoteInputs(
        item.footnotes,
        confirmedFootnotes,
        footnoteInputValues
      );
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
          setFootnoteInputErrors(footnoteValidation.errors);
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
        setFootnoteInputErrors({});
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

      function validateNumericInputsForPayload() {
        const normalizedValuesByKey = new Map<string, string>();
        let hasError = false;

        for (const input of numericCalculationInputs) {
          const inputKey = getInputStateKey(input);
          const validation = validateNumericInput(input, inputValues[inputKey] ?? "", {
            mainValue: mainNumericValue,
            requireNotGreaterThanMain: shouldValidateInputAgainstMainValue(
              input,
              mainNumericInput
            )
          });

          if (!validation.ok) {
            nextInputErrors[inputKey] = validation.message;
            hasError = true;
            continue;
          }

          normalizedValuesByKey.set(inputKey, validation.value);
        }

        return {
          hasError,
          values: numericCalculationInputs.map(
            (input) => normalizedValuesByKey.get(getInputStateKey(input)) ?? ""
          )
        };
      }

      if (itemType === "multi-input" || (selectedRowInput !== null && itemType !== "range-based")) {
        const hasSelectedInputError = applySelectedRowInputs();
        const { hasError, values } = validateNumericInputsForPayload();
        if (hasError || hasSelectedInputError) {
          return applyFailure("ورودی‌های لازم را کامل و معتبر وارد کنید.");
        }

        if (values.length > 0) {
          calculateBody.values = values;
        }
      } else if (itemType === "range-based") {
        if (calculationInputs.length > 0) {
          const hasSelectedInputError = applySelectedRowInputs();
          const { hasError, values } = validateNumericInputsForPayload();

          if (hasError || hasSelectedInputError) {
            return applyFailure("ورودی‌های لازم را کامل و معتبر وارد کنید.");
          }

          if (values.length > 0) {
            calculateBody.values = values;
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

      if (!footnoteValidation.ok) {
        return applyFailure("ورودی‌های لازم تبصره‌ها را کامل و معتبر وارد کنید.");
      }
      const selectedFootnotes = buildFootnotesPayload({
        notes: item.footnotes,
        confirmedFootnotes,
        footnoteInputValues
      });
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
      footnoteInputValues,
      hasDrivingValueForRange,
      inputValues,
      item,
      itemType,
      mainNumericInput,
      mainNumericValue,
      manualUnitPrice,
      matchedRangeRow,
      numericCalculationInputs,
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
          const missingStarredPrices = getBackendMissingStarredPrices(error);
          if (missingStarredPrices) {
            const knownCodes = new Set(item.rows.map((row) => row.row_code));
            const unknownCodes = missingStarredPrices.filter((rowCode) => !knownCodes.has(rowCode));
            revealMissingStarredPrices(missingStarredPrices.filter((rowCode) => knownCodes.has(rowCode)));
            setCalculation(null);
            calculationRef.current = null;
            latestCalculatedPayloadKeyRef.current = null;
            setCalculationStatus(options.forAdd ? "error" : "waiting");
            setCalculationError(
              unknownCodes.length > 0
                ? `ردیف‌های قیمت‌گذاری‌نشده در جزئیات آیتم پیدا نشدند: ${unknownCodes.join("، ")}`
                : options.forAdd
                  ? `قیمت ${missingStarredPrices.length} ردیف باید تعیین شود.`
                  : null
            );
            return null;
          }
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

          const footnoteError = getBackendFootnoteInputError(error);
          if (footnoteError) {
            setFootnoteInputErrors((current) => ({
              ...current,
              [footnoteError.footnoteId]: {
                ...(current[footnoteError.footnoteId] ?? {}),
                [footnoteError.field]: footnoteError.detail
              }
            }));
            setTouchedFootnoteInputs((current) => ({
              ...current,
              [footnoteError.footnoteId]: {
                ...(current[footnoteError.footnoteId] ?? {}),
                [footnoteError.field]: true
              }
            }));
            setCalculationStatus(options.forAdd ? "error" : "waiting");
            setCalculationError(options.forAdd ? footnoteError.detail : null);
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
    [calculatePricebookItem, item.id, item.rows, rangeFallbackRow?.row_code, revealMissingStarredPrices]
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

  const handleAddLine = useCallback(async () => {
    setHasSubmitAttempted(true);
    setTouchedFootnoteInputs(
      Object.fromEntries(
        item.footnotes
          .filter((note) => confirmedFootnotes[note.note_code] && note.requires_input)
          .map((note) => [
            note.note_code,
            Object.fromEntries((note.inputs ?? []).map((input) => [input.name, true]))
          ])
      )
    );
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

    const locallyActiveRows = item.rows.filter((row) =>
      item.rows.length === 1 ||
      row.id === selectedRowId ||
      row.id === matchedRangeRow?.id
    );
    const locallyMissingStarredPrices = locallyActiveRows
      .filter(
        (row) =>
          (row.requires_manual_unit_price ||
            (item.rows.length === 1 && item.requires_manual_unit_price)) &&
          !hasPositiveMoneyValue(row.unit_price) &&
          !isPositiveDecimal(customPrices[row.row_code] ?? "")
      )
      .map((row) => row.row_code);
    if (locallyMissingStarredPrices.length > 0) {
      revealMissingStarredPrices(locallyMissingStarredPrices, true);
      setCalculationStatus("error");
      setCalculationError(`قیمت ${locallyMissingStarredPrices.length} ردیف باید تعیین شود.`);
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

    if (idempotencyRef.current?.payloadKey !== payload.key) {
      idempotencyRef.current = { payloadKey: payload.key, key: createLineIdempotencyKey() };
    }

    const lineBody: FinancialDocumentLineCreatePayload = {
      idempotency_key: idempotencyRef.current.key,
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
      const createdLine = await createFinancialDocumentLine({
        body: lineBody,
        documentId: document.id
      }).unwrap();
      idempotencyRef.current = null;
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      const addedLine =
        updatedDocument.lines.find((line) => line.id === createdLine.id) ?? createdLine;
      const addedDisplayRows = getLineDisplayRows(addedLine);
      setAddedRowsLines([addedLine]);
      setHasSubmitAttempted(false);
      onToast(
        createdLine.idempotent_replayed
          ? "این ردیف قبلاً ثبت شده بود؛ توکن دوباره کسر نشد."
          : addedDisplayRows.length > 1
            ? "ردیف‌ها به صورت‌بها اضافه شدند."
            : "ردیف به صورت‌بها اضافه شد.",
        "success"
      );
      setShowAddedRows(true);
    } catch (error) {
      if (isInsufficientTokenBalance(error)) {
        setLineError(formatInsufficientBalanceMessage(error.data));
        return;
      }
      if (isIdempotencyKeyReused(error)) {
        idempotencyRef.current = null;
        setLineError("کلید تکرار ثبت قبلاً برای درخواست دیگری استفاده شده است. دوباره تلاش کنید.");
        return;
      }
      const missingStarredPrices = getBackendMissingStarredPrices(error);
      if (missingStarredPrices) {
        const knownCodes = new Set(item.rows.map((row) => row.row_code));
        const matchedCodes = missingStarredPrices.filter((rowCode) => knownCodes.has(rowCode));
        const unknownCodes = missingStarredPrices.filter((rowCode) => !knownCodes.has(rowCode));
        revealMissingStarredPrices(matchedCodes, true);
        setLineError(
          unknownCodes.length > 0
            ? `ردیف‌های قیمت‌گذاری‌نشده در جزئیات آیتم پیدا نشدند: ${unknownCodes.join("، ")}`
            : null
        );
        return;
      }
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
    confirmedFootnotes,
    customPrices,
    document,
    documentLocked,
    item.id,
    item.footnotes,
    item.requires_manual_unit_price,
    item.rows,
    matchedRangeRow?.id,
    onDocumentUpdated,
    onToast,
    recalculateFinancialDocument,
    revealMissingStarredPrices,
    runCalculation,
    selectedRowId
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
    setGuidedMissingRowCode(null);
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
    setCalculationError(null);
    setLineError(null);
    window.setTimeout(() => {
      rowPriceInputRefs.current[rowCode]?.focus({ preventScroll: true });
    }, 0);
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

  function applyRowCustomPrice(rowCode: string, draftPrice = editingRowPrice) {
    const normalized = normalizeQuantityValue(draftPrice);

    if (!isPositiveDecimal(normalized)) {
      setCustomPriceErrors((current) => ({
        ...current,
        [rowCode]: "قیمت ستاره‌دار باید یک عدد مثبت باشد."
      }));
      return;
    }

    setCustomPrices((current) => ({ ...current, [rowCode]: normalized }));
    setCustomPriceErrors((current) => ({ ...current, [rowCode]: null }));
    setEditingRowCode(null);
    setEditingRowPrice("");
    setMissingStarredDraftPrices((current) => {
      const next = { ...current };
      delete next[rowCode];
      return next;
    });
    const remainingMissingCodes = missingStarredRowCodes.filter((code) => code !== rowCode);
    missingStarredRowCodesRef.current = remainingMissingCodes;
    setMissingStarredRowCodes(remainingMissingCodes);
    lastGuidedMissingSetRef.current = "";
    if (remainingMissingCodes.length > 0) {
      revealMissingStarredPrices(remainingMissingCodes, true);
    } else {
      setGuidedMissingRowCode(null);
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
    setHasSubmitAttempted(false);
    setCalculationError(null);
    setLineError(null);
  }

  const currentPayload = buildCalculationPayload(false);
  const isCalculating = isAutoCalculating || calculateState.isLoading;
  const isAddingLine =
    isAddFlowCalculating || createLineState.isLoading || recalculateState.isLoading;
  const addLineDisabledReason = !document
    ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
    : documentLocked
      ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
      : null;

  const hasCommittedInputError = Boolean(
    calculationError ||
      lineError ||
      quantityError ||
      manualUnitPriceError ||
      rowSelectionError ||
      Object.values(inputErrors).some(Boolean) ||
      Object.values(customPriceErrors).some(Boolean)
      || Object.values(footnoteInputErrors).some((fields) => Object.values(fields).some(Boolean))
  );
  const hasExplicitAddFailure = hasSubmitAttempted && hasCommittedInputError;
  const calculationStatusDot: CalculationStatusDotState = hasExplicitAddFailure
    ? "red"
    : calculationStatus === "ready" &&
        calculation &&
        currentPayload.ok &&
        !isCalculating &&
        !calculationError
      ? "green"
      : "yellow";

  const handleScrollToRows = useCallback(() => {
    rowsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const headerAction = (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
      <label className="min-w-0 space-y-1">
        <span className="block text-xs font-bold text-slate-400 light:text-slate-500">
          ضرایب
        </span>
        <select
          className={classNames(inputClasses, "h-9 w-full min-w-0 px-2 text-xs sm:h-10 sm:w-40 sm:max-w-[10rem]")}
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
        className="min-w-24 px-3 sm:min-w-28 sm:px-4"
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
          <AddedRowsView lines={addedRowsLines} onClose={onClose} onToast={onToast} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[85dvh] flex-col">
      <ModalHeader action={headerAction} onClose={onClose} title={item.short_name_fa ?? "جزئیات آیتم"} />
      <div ref={modalScrollRef} className="space-y-3 overflow-y-auto overscroll-contain p-4">
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

        <CalculationSection
          calculation={calculation}
          calculationError={
            calculationStatus === "error" ? calculationError : hasSubmitAttempted ? calculationError : null
          }
          calculationStatusDot={calculationStatusDot}
          customPriceRowCodes={activeCustomPriceRowCodes}
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
          onRowsClick={item.rows.length > 0 ? handleScrollToRows : undefined}
          quantity={quantity}
          quantityError={hasSubmitAttempted ? quantityError : null}
          rangeMatchError={hasSubmitAttempted && itemType === "range-based" ? rangeMatchError : undefined}
          requiresManualPrice={requiresManualPrice}
          requiresRowPrice={hasManualUnitPrice(item) && usesRowSpecificPriceInputs}
          requiresRowSelection={needsRowSelection || selectedRowInput !== null}
          rowSelection={rowSelection}
          setManualUnitPrice={handleManualUnitPriceChange}
          setQuantity={handleQuantityChange}
          unit={item.unit || undefined}
        />

        <ChecklistNotesSection
          disabled={isAddingLine}
          inputErrors={footnoteInputErrors}
          inputValues={footnoteInputValues}
          notes={item.footnotes}
          onInputBlur={(noteCode, inputName) => {
            setTouchedFootnoteInputs((current) => ({
              ...current,
              [noteCode]: { ...(current[noteCode] ?? {}), [inputName]: true }
            }));
            const validation = validateFootnoteInputs(item.footnotes, confirmedFootnotes, footnoteInputValues);
            setFootnoteInputErrors(validation.errors);
          }}
          onInputChange={(noteCode, inputName, value) => {
            setFootnoteInputValues((current) => ({
              ...current,
              [noteCode]: { ...(current[noteCode] ?? {}), [inputName]: value }
            }));
            setFootnoteInputErrors((current) => ({
              ...current,
              [noteCode]: { ...(current[noteCode] ?? {}), [inputName]: null }
            }));
            setHasSubmitAttempted(false);
            setCalculationError(null);
            setLineError(null);
          }}
          onToggle={(noteCode, checked) => {
            setConfirmedFootnotes((current) => ({ ...current, [noteCode]: checked }));
            if (checked) {
              const note = item.footnotes.find((candidate) => candidate.note_code === noteCode);
              setFootnoteInputValues((current) => ({
                ...current,
                [noteCode]: {
                  ...(current[noteCode] ?? {}),
                  ...Object.fromEntries(
                    (note?.inputs ?? [])
                      .filter((input) => current[noteCode]?.[input.name] === undefined && input.default_value !== null)
                      .map((input) => [input.name, input.default_value as string])
                  )
                }
              }));
            }
            setHasSubmitAttempted(false);
            setCalculationError(null);
            setLineError(null);
          }}
          selectedNotes={confirmedFootnotes}
          touchedInputs={touchedFootnoteInputs}
        />

        {item.rows.length > 0 ? (
          <section ref={rowsSectionRef}>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">
              ردیف‌های فهرست‌بها
            </h3>
            <div className="mt-2 space-y-2">
              {item.rows.map((row) => {
                const customPrice = customPrices[row.row_code];
                const hasCustomPrice = Boolean(customPrice);
                const hasOfficialPrice =
                  hasPositiveMoneyValue(row.unit_price);
                const isMissingStarredPrice =
                  !hasCustomPrice &&
                  !hasOfficialPrice &&
                  (row.requires_manual_unit_price ||
                    (item.rows.length === 1 && item.requires_manual_unit_price) ||
                    missingStarredRowCodes.includes(row.row_code));
                const officialPriceLabel = hasOfficialPrice
                  ? formatMoneyAmount(row.unit_price)
                  : "-";
                const calculatedRow = activeCalculationRowsByCode.get(row.row_code) ?? null;
                const isMissingPriceEdit = missingStarredRowCodes.includes(row.row_code);
                const isEditing = editingRowCode === row.row_code;
                const currentEditingPrice = isMissingPriceEdit
                  ? missingStarredDraftPrices[row.row_code] ?? ""
                  : editingRowPrice;
                const priceControlsDisabled = documentLocked || isAddingLine;
                const rowTitle = row.title_fa || row.short_title_fa || row.row_code;
                const mobileDescription = getCompactRowDescription(
                  rowTitle,
                  row.description_fa
                );
                const displayPrice = hasCustomPrice
                  ? formatMoneyAmount(customPrice)
                  : officialPriceLabel;

                return (
                  <div
                    ref={(element) => { rowRefs.current[row.row_code] = element; }}
                    className={classNames(
                      "relative overflow-hidden border-b px-2.5 py-2 text-sm transition last:border-b-0 md:rounded-lg md:border md:px-3 md:py-2",
                      missingStarredRowCodes.includes(row.row_code)
                        ? "border-rose-400/50 bg-rose-500/8 light:border-rose-300 light:bg-rose-50"
                        : isMissingStarredPrice
                          ? "border-amber-300/35 bg-amber-400/8 light:border-amber-300 light:bg-amber-50"
                      : calculatedRow
                        ? "border-b-emerald-300/25 bg-emerald-400/8 before:absolute before:inset-y-1 before:right-0 before:w-0.5 before:rounded-full before:bg-emerald-300 light:bg-emerald-50/80 md:border-emerald-300/35 md:bg-emerald-400/10 md:before:hidden light:md:border-emerald-300/60 light:md:bg-emerald-50"
                        : "border-b-white/10 bg-transparent light:border-b-slate-200 md:border-white/10 md:bg-white/7 light:md:border-slate-200 light:md:bg-slate-50"
                    )}
                    key={row.id}
                  >
                    <div className="md:hidden">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-200 light:text-emerald-700">
                            {row.row_code}
                          </span>
                          {calculatedRow ? (
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/12 px-1.5 py-px text-[10px] font-bold text-emerald-100 light:text-emerald-800">
                              انتخاب‌شده
                            </span>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {isEditing ? (
                            <>
                              <input
                                ref={(element) => { rowPriceInputRefs.current[row.row_code] = element; }}
                                aria-label={isMissingStarredPrice ? `باید قیمت ردیف ${row.row_code} را تعیین کنید` : `ویرایش قیمت ردیف ${row.row_code}`}
                                className="h-7 w-24 max-w-[7rem] rounded-md border border-white/10 bg-slate-950/45 px-2 text-left text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 light:border-slate-200 light:bg-white light:text-slate-950"
                                dir="ltr"
                                disabled={priceControlsDisabled}
                                inputMode="decimal"
                                onChange={(event) =>
                                  isMissingPriceEdit
                                    ? setMissingStarredDraftPrices((current) => ({ ...current, [row.row_code]: event.target.value }))
                                    : handleEditingRowPriceChange(row.row_code, event.target.value)
                                }
                                placeholder={hasOfficialPrice ? String(row.unit_price) : "بهای واحد"}
                                value={currentEditingPrice}
                              />
                              <button
                                aria-label="ثبت بهای واحد"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-emerald-200 transition hover:bg-emerald-400/10 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 light:text-emerald-700 light:hover:bg-emerald-50"
                                disabled={priceControlsDisabled}
                                onClick={() => applyRowCustomPrice(row.row_code, currentEditingPrice)}
                                title="ثبت بهای واحد"
                                type="button"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label="لغو ویرایش بهای واحد"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
                                disabled={priceControlsDisabled}
                                onClick={() => cancelRowPriceEdit(row.row_code)}
                                title="لغو"
                                type="button"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                className={classNames(
                                  "text-[10px] font-bold",
                                  hasCustomPrice
                                    ? "text-amber-200 light:text-amber-700"
                                    : "text-emerald-200 light:text-emerald-700"
                                )}
                              >
                                {hasCustomPrice || isMissingStarredPrice ? "★ ستاره‌دار" : "قیمت رسمی"}
                              </span>
                              <span
                                className="max-w-[7rem] truncate text-left text-xs font-bold text-slate-200 light:text-slate-800"
                                dir="ltr"
                                title={
                                  isMissingStarredPrice
                                    ? "باید قیمت این ردیف را تعیین کنید."
                                    : displayPrice
                                }
                              >
                                {displayPrice}
                              </span>
                              <button
                                aria-label="ویرایش بهای واحد"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
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
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
                                  disabled={priceControlsDisabled}
                                  onClick={() => resetRowCustomPrice(row.row_code)}
                                  title={`بازگشت به قیمت رسمی: ${officialPriceLabel}`}
                                  type="button"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 truncate text-sm font-bold leading-5 text-slate-100 light:text-slate-800">
                        {rowTitle}
                      </p>
                      {mobileDescription ? (
                        <p className="mt-0.5 truncate text-xs leading-4 text-slate-400 light:text-slate-500">
                          {mobileDescription}
                        </p>
                      ) : null}
                      {calculatedRow ? (
                        <p className="mt-1 truncate text-xs font-medium leading-4 text-emerald-100 light:text-emerald-800">
                          مقدار: {formatDecimal(calculatedRow.quantity)}{" "}
                          {calculatedRow.unit ?? row.unit} · مبلغ:{" "}
                          {formatMoneyAmount(calculatedRow.total)}
                        </p>
                      ) : null}
                    </div>

                    <div className="hidden gap-x-3 gap-y-2 md:grid md:grid-cols-[6rem_minmax(0,1fr)_5rem_minmax(13rem,auto)] md:items-center">
                      <span className="font-mono font-bold text-emerald-200 light:text-emerald-700">
                        {row.row_code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-100 light:text-slate-800">
                          {rowTitle}
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
                        {calculatedRow ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-2 py-0.5 font-bold text-emerald-100 light:text-emerald-800">
                              در محاسبه
                            </span>
                            <span className="text-slate-300 light:text-slate-700">
                              مقدار: {formatDecimal(calculatedRow.quantity)}{" "}
                              {calculatedRow.unit ?? row.unit}
                            </span>
                            <span className="font-bold text-slate-200 light:text-slate-800">
                              مبلغ: {formatMoneyAmount(calculatedRow.total)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <span className="text-slate-400 light:text-slate-500">{row.unit}</span>
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 md:justify-end">
                        {isEditing ? (
                          <>
                              <input
                              ref={(element) => { rowPriceInputRefs.current[row.row_code] = element; }}
                              aria-label={isMissingStarredPrice ? `باید قیمت ردیف ${row.row_code} را تعیین کنید` : `ویرایش قیمت ردیف ${row.row_code}`}
                              className="h-8 w-32 rounded-md border border-white/10 bg-slate-950/45 px-2 text-left text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 light:border-slate-200 light:bg-white light:text-slate-950"
                              dir="ltr"
                              disabled={priceControlsDisabled}
                              inputMode="decimal"
                              onChange={(event) =>
                                isMissingPriceEdit
                                  ? setMissingStarredDraftPrices((current) => ({ ...current, [row.row_code]: event.target.value }))
                                  : handleEditingRowPriceChange(row.row_code, event.target.value)
                              }
                              placeholder={hasOfficialPrice ? String(row.unit_price) : "بهای واحد"}
                              value={currentEditingPrice}
                            />
                            <button
                              aria-label="ثبت بهای واحد"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-200 transition hover:bg-emerald-400/10 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 light:text-emerald-700 light:hover:bg-emerald-50"
                              disabled={priceControlsDisabled}
                              onClick={() => applyRowCustomPrice(row.row_code, currentEditingPrice)}
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
                              {hasCustomPrice || isMissingStarredPrice ? "★ ستاره‌دار" : "قیمت رسمی"}
                            </span>
                            <span
                              className="font-bold text-slate-200 light:text-slate-800"
                              title={
                                isMissingStarredPrice
                                  ? "باید قیمت این ردیف را تعیین کنید."
                                  : displayPrice
                              }
                            >
                              {displayPrice}
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
                    {guidedMissingRowCode === row.row_code && !isEditing ? (
                      <div
                        className="mt-2 rounded-md border border-amber-300/35 bg-amber-400/12 px-2.5 py-2 text-xs font-bold leading-5 text-amber-100 shadow-lg light:border-amber-300 light:bg-amber-50 light:text-amber-900 md:mr-auto md:max-w-sm"
                        role="tooltip"
                      >
                        برای ادامه، روی مداد بزنید و قیمت این ردیف را وارد کنید.
                      </div>
                    ) : null}
                    {customPriceErrors[row.row_code] ? (
                      <p className="mt-1 text-xs text-rose-300 light:text-rose-700">
                        {customPriceErrors[row.row_code]}
                      </p>
                    ) : null}
                    {isMissingStarredPrice && !customPriceErrors[row.row_code] ? (
                      <p
                        aria-label={`باید قیمت ردیف ${row.row_code} را تعیین کنید`}
                        className="mt-1 text-xs text-amber-200 light:text-amber-700"
                        title="باید قیمت را تعیین کنید"
                      >
                        قیمت تعیین نشده
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
