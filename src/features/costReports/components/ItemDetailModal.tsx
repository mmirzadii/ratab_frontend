import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "../../../app/appShellContext";
import { Check, Loader2, Pencil, RotateCcw, Send, Trash2, X, XCircle } from "lucide-react";

import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import {
  useRetrievePricebookItemQuery,
  type PricebookCalculateInputPayload,
  type PricebookCalculateResponse,
  type PricebookItemDetail
} from "../../pricebooks/pricebookApi";
import {
  type FinancialDocumentLineCreatePayload,
  useCreateFinancialDocumentLineMutation,
  useCreateOfficialCalculationMutation,
  useCreateOfficialCalculationSessionMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import {
  type CalculationBillingSummary,
  type CombinedTokenBillingError,
  createCalculationIdempotencyKey,
  createLineIdempotencyKey,
  formatBillingBreakdown,
  formatCalculationCostLabel,
  getCombinedInsufficientBalance,
  isIdempotencyKeyReused,
  isInsufficientCombinedTokenBalance,
  useGetTokenWalletQuery
} from "../../wallet/walletApi";
import { Button } from "../../../shared/components/Button";
import { EmptyState } from "../../../shared/components/EmptyState";
import { InsufficientTokenModal } from "../../../shared/components/InsufficientTokenModal";
import { MathNumericInput } from "../../../shared/math/MathNumericInput";
import { useEscapeLayer } from "../../../shared/shortcuts/useShortcut";
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { classNames } from "../../../shared/utils/classNames";
import { inputClasses } from "../constants";
import { isOfficialCalculationResult } from "../calculationTypes";
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
        <h3 className="text-lg font-black text-ui-text-primary">
          ردیف‌های اضافه‌شده
        </h3>
        <p className="mt-1 text-sm leading-7 text-ui-text-secondary">
          {hasMultipleRows
            ? "ردیف‌ها با موفقیت به صورت‌بها اضافه شدند."
            : "ردیف با موفقیت به صورت‌بها اضافه شد."}
        </p>
        {hasMultipleRows ? (
          <p className="mt-1 text-xs font-bold text-ui-primary">
            {formatDecimal(displayRowCount)} ردیف اضافه شد
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        {localLines.length === 0 ? (
          <p className="text-center text-sm text-ui-text-muted">
            هنوز ردیفی اضافه نشده است.
          </p>
        ) : null}
        {displayGroups.map(({ line, rows }) => (
          <div
            className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-4"
            key={line.id}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-base font-bold text-ui-text-primary"
                  title={cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                >
                  {cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                </p>
                {rows.length > 1 ? (
                  <p className="mt-1 text-xs text-ui-text-muted">
                    {formatDecimal(rows.length)} ردیف محاسبه‌شده
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  aria-label="ویرایش"
                  className="rounded-lg p-1.5 text-ui-text-muted transition hover:bg-ui-primary-soft hover:text-ui-primary"
                  onClick={() => onToast("ویرایش در نسخه بعدی")}
                  title="ویرایش"
                  type="button"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  aria-label="حذف"
                  className="rounded-lg p-1.5 text-ui-text-muted transition hover:bg-rose-500/10 hover:text-rose-400"
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
                  className="grid gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/25 p-3 text-sm sm:grid-cols-[6rem_1fr_7rem_8rem] sm:items-center"
                  key={`${row.parentLineId}-${row.rowCode ?? "row"}-${index}`}
                >
                  <span className="font-mono font-bold text-ui-primary">
                    {row.rowCode ?? "—"}
                  </span>
                  <span
                    className="min-w-0 truncate text-ui-text-primary"
                    title={cleanDisplayText(row.title, "شرح ثبت نشده")}
                  >
                    {cleanDisplayText(row.title, "شرح ثبت نشده")}
                  </span>
                  <span className="text-ui-text-muted">
                    {formatDecimal(row.quantity)} {cleanDisplayText(row.unit, "")}
                  </span>
                  <span className="font-bold text-ui-text-secondary">
                    {formatMoneyAmount(row.total)}
                  </span>
                  <span className="text-xs text-ui-text-muted sm:col-start-4">
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
        className="w-full rounded-lg border border-ui-border-subtle bg-ui-surface-subtle py-3 text-base font-bold text-ui-text-secondary transition hover:bg-ui-surface-hover"
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

type CalculationReceipt = {
  billing: CalculationBillingSummary;
  id: number;
  payloadKey: string;
};

type CalculationExecutionResult =
  | { ok: true; receipt: CalculationReceipt }
  | { ok: false; reason: "insufficient" | "invalid" | "blocked" | "error" };

const AUTO_CALCULATION_DEBOUNCE_MS = 500;

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
    <div className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-ui-border-subtle bg-ui-surface p-3 backdrop-blur sm:flex sm:flex-nowrap sm:gap-3 sm:p-4">
      <button
        aria-label="بستن"
        className="shrink-0 rounded-lg p-1.5 text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
        onClick={onClose}
        title="بستن"
        type="button"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 className="min-w-0 flex-1 truncate text-right text-base font-black text-ui-text-primary">
        {title}
      </h2>
      <div className="col-span-2 flex min-w-0 w-full items-center justify-end gap-2 sm:col-auto sm:w-auto sm:min-w-[12rem]">{action}</div>
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
  documentPricebookId,
  item,
  onClose,
  onDocumentUpdated,
  onSelectedCoefficientSetIdChange,
  onToast,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  documentPricebookId: number | null;
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
  const [currentReceipt, setCurrentReceipt] = useState<CalculationReceipt | null>(null);
  const [calculationSessionId, setCalculationSessionId] = useState<string | null>(null);
  // Recorded silently by background auto-calc; the purchase dialog only opens from handleAddLine.
  const [insufficientBalance, setInsufficientBalance] =
    useState<{ error: CombinedTokenBillingError; payloadKey: string } | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
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
  const { data: wallet } = useGetTokenWalletQuery();
  const [createOfficialCalculationSession] = useCreateOfficialCalculationSessionMutation();
  const [createOfficialCalculation, calculateState] = useCreateOfficialCalculationMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();

  const latestCalculatedPayloadKeyRef = useRef<string | null>(null);
  const calculationRef = useRef<PricebookCalculateResponse | null>(null);
  const calculationStatusRef = useRef<CalculationStatus>("waiting");
  const rowsSectionRef = useRef<HTMLElement | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rowPriceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lastGuidedMissingSetRef = useRef("");
  const missingStarredRowCodesRef = useRef<string[]>([]);
  // Retry key per payload: reusing it lets the backend replay instead of double-charging.
  const calculationIdempotencyRef = useRef<{ payloadKey: string; key: string } | null>(null);
  // Line create key scoped to the spent/unspent calculation receipt.
  const lineIdempotencyRef = useRef<{ key: string; receiptId: number } | null>(null);
  // Free per-item modal session; issued once per open modal, required by official-calculations.
  const calculationSessionIdRef = useRef<string | null>(null);
  // 500ms auto-calc debounce timer, restarted whenever the financially relevant payload changes.
  const pendingAutoTimerRef = useRef<number | null>(null);
  // Bumped per request so late responses to superseded inputs are ignored.
  const latestRequestIdRef = useRef(0);
  // Dedupe identical concurrent official-calculation requests (auto-fire + forced Add).
  const inFlightPayloadKeyRef = useRef<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<CalculationExecutionResult> | null>(null);

  useEffect(() => {
    calculationStatusRef.current = calculationStatus;
  }, [calculationStatus]);

  const clearPendingAutoTimer = useCallback(() => {
    if (pendingAutoTimerRef.current !== null) {
      window.clearTimeout(pendingAutoTimerRef.current);
      pendingAutoTimerRef.current = null;
    }
  }, []);

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

  const clearPaidCalculation = useCallback((status: CalculationStatus = "stale") => {
    setCalculation(null);
    calculationRef.current = null;
    latestCalculatedPayloadKeyRef.current = null;
    setCurrentReceipt(null);
    calculationIdempotencyRef.current = null;
    lineIdempotencyRef.current = null;
    setCalculationStatus(status);
    setCalculationError(null);
    setInsufficientBalance(null);
    setShowPurchaseModal(false);
  }, []);

  // Session lifecycle: open a free modal session per document+item, reset on close/change.
  useEffect(() => {
    clearPendingAutoTimer();
    inFlightPayloadKeyRef.current = null;
    inFlightPromiseRef.current = null;
    calculationSessionIdRef.current = null;
    setCalculationSessionId(null);
    setInsufficientBalance(null);
    setShowPurchaseModal(false);

    if (!document || documentLocked) {
      return undefined;
    }

    let cancelled = false;
    createOfficialCalculationSession({
      documentId: document.id,
      body: { pricebook_item_id: item.id }
    })
      .unwrap()
      .then((session) => {
        if (cancelled) return;
        calculationSessionIdRef.current = session.calculation_session_id;
        setCalculationSessionId(session.calculation_session_id);
      })
      .catch((error) => {
        if (cancelled) return;
        setCalculationError(
          getApiErrorMessage(error, "شروع نشست محاسبه ممکن نشد. صفحه را دوباره باز کنید.")
        );
      });

    return () => {
      cancelled = true;
      clearPendingAutoTimer();
      inFlightPayloadKeyRef.current = null;
      inFlightPromiseRef.current = null;
      calculationSessionIdRef.current = null;
      setCalculationSessionId(null);
      setInsufficientBalance(null);
      setShowPurchaseModal(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id, item.id, documentLocked]);

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

  const markFootnoteInputsTouched = useCallback(() => {
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
  }, [confirmedFootnotes, item.footnotes]);

  // Single calculation executor shared by the 500ms auto-calc debounce and the forced
  // immediate calculation Add falls back to when there is no fresh matching receipt yet.
  const executeCalculation = useCallback(async (): Promise<CalculationExecutionResult> => {
    if (!document) {
      setCalculationError("سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید.");
      setCalculationStatus("error");
      return { ok: false, reason: "blocked" };
    }

    if (documentLocked) {
      setCalculationError("این صورت‌بها قفل شده و امکان محاسبه ندارد.");
      setCalculationStatus("error");
      return { ok: false, reason: "blocked" };
    }

    const sessionId = calculationSessionIdRef.current;
    if (!sessionId) {
      // Session still opening; the debounce effect re-fires automatically once it's ready.
      setCalculationStatus("waiting");
      return { ok: false, reason: "blocked" };
    }

    const locallyActiveRows = item.rows.filter(
      (row) =>
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
      return { ok: false, reason: "invalid" };
    }

    const payload = buildCalculationPayload(true);
    if (!payload.ok) {
      setCalculationStatus("waiting");
      return { ok: false, reason: "invalid" };
    }

    // Avoid firing a duplicate request for the exact same payload; join the in-flight one.
    if (inFlightPayloadKeyRef.current === payload.key && inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    if (calculationIdempotencyRef.current?.payloadKey !== payload.key) {
      calculationIdempotencyRef.current = {
        payloadKey: payload.key,
        key: createCalculationIdempotencyKey()
      };
    }
    const idempotencyKey = calculationIdempotencyRef.current.key;

    setCalculationStatus("calculating");
    setCalculationError(null);

    const requestId = ++latestRequestIdRef.current;

    const requestPromise = (async (): Promise<CalculationExecutionResult> => {
      try {
        const billed = await createOfficialCalculation({
          documentId: document.id,
          body: {
            calculation_session_id: sessionId,
            idempotency_key: idempotencyKey,
            pricebook_item_id: item.id,
            ...payload.body
          }
        }).unwrap();

        const isStale = latestRequestIdRef.current !== requestId;

        if (!isOfficialCalculationResult(billed.result)) {
          if (!isStale) {
            setCalculationStatus("error");
            setCalculationError("پاسخ محاسبه معتبر نبود. دوباره تلاش کنید.");
          }
          return { ok: false, reason: "error" };
        }

        const receipt: CalculationReceipt = {
          billing: billed.billing,
          id: billed.receipt.id,
          payloadKey: payload.key
        };

        if (!isStale) {
          latestCalculatedPayloadKeyRef.current = payload.key;
          calculationRef.current = billed.result;
          setCalculation(billed.result);
          setCurrentReceipt(receipt);
          lineIdempotencyRef.current = null;
          setCalculationStatus("ready");
          setCalculationError(null);
          setInsufficientBalance(null);

          const appliedCost = Number(billed.billing.applied_cost);
          if (Number.isFinite(appliedCost) && appliedCost > 0 && !billed.replayed) {
            onToast("محاسبه انجام شد.", "success");
          }
        }

        return { ok: true, receipt };
      } catch (error) {
        const isStale = latestRequestIdRef.current !== requestId;
        if (isStale) {
          return { ok: false, reason: "error" };
        }

        if (isInsufficientCombinedTokenBalance(error)) {
          const combined = getCombinedInsufficientBalance(error);
          if (combined) {
            setInsufficientBalance({ error: combined, payloadKey: payload.key });
            // Keep the session id from the 402 response when the backend provides one.
            if (combined.calculation_session_id) {
              calculationSessionIdRef.current = combined.calculation_session_id;
              setCalculationSessionId(combined.calculation_session_id);
            }
          }
          setCalculation(null);
          calculationRef.current = null;
          latestCalculatedPayloadKeyRef.current = null;
          setCurrentReceipt(null);
          setCalculationStatus("waiting");
          setCalculationError(null);
          return { ok: false, reason: "insufficient" };
        }

        if (isIdempotencyKeyReused(error)) {
          calculationIdempotencyRef.current = null;
          setCalculationStatus("error");
          setCalculationError(
            "کلید تکرار محاسبه قبلاً برای درخواست دیگری استفاده شده است. دوباره تلاش کنید."
          );
          return { ok: false, reason: "error" };
        }

        const missingStarredPrices = getBackendMissingStarredPrices(error);
        if (missingStarredPrices) {
          const knownCodes = new Set(item.rows.map((row) => row.row_code));
          const unknownCodes = missingStarredPrices.filter((rowCode) => !knownCodes.has(rowCode));
          revealMissingStarredPrices(
            missingStarredPrices.filter((rowCode) => knownCodes.has(rowCode)),
            true
          );
          setCalculation(null);
          calculationRef.current = null;
          latestCalculatedPayloadKeyRef.current = null;
          setCurrentReceipt(null);
          setCalculationStatus("error");
          setCalculationError(
            unknownCodes.length > 0
              ? `ردیف‌های قیمت‌گذاری‌نشده در جزئیات آیتم پیدا نشدند: ${unknownCodes.join("، ")}`
              : `قیمت ${missingStarredPrices.length} ردیف باید تعیین شود.`
          );
          return { ok: false, reason: "invalid" };
        }

        const customPriceRequest = getBackendCustomPriceRequest(error);
        if (customPriceRequest) {
          const fallbackRowCode = customPriceRequest.rowCode ?? rangeFallbackRow?.row_code ?? null;
          setCalculation(null);
          calculationRef.current = null;
          latestCalculatedPayloadKeyRef.current = null;
          setCurrentReceipt(null);
          setCalculationStatus("waiting");
          setCalculationError(null);
          if (fallbackRowCode) {
            setBackendFallbackRowCode(fallbackRowCode);
            setCustomPriceErrors((current) => ({
              ...current,
              [fallbackRowCode]: "برای مقدار خارج از بازه، بهای واحد سفارشی لازم است."
            }));
          }
          return { ok: false, reason: "invalid" };
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
          setCalculationStatus("error");
          setCalculationError(footnoteError.detail);
          return { ok: false, reason: "invalid" };
        }

        const message = getManualPriceValidationMessage(error);
        setCalculation(null);
        calculationRef.current = null;
        latestCalculatedPayloadKeyRef.current = null;
        setCurrentReceipt(null);
        setCalculationStatus("error");
        setCalculationError(message);
        return { ok: false, reason: "error" };
      } finally {
        if (inFlightPayloadKeyRef.current === payload.key) {
          inFlightPayloadKeyRef.current = null;
          inFlightPromiseRef.current = null;
        }
      }
    })();

    inFlightPayloadKeyRef.current = payload.key;
    inFlightPromiseRef.current = requestPromise;
    return requestPromise;
  }, [
    buildCalculationPayload,
    createOfficialCalculation,
    customPrices,
    document,
    documentLocked,
    item.id,
    item.requires_manual_unit_price,
    item.rows,
    matchedRangeRow?.id,
    onToast,
    rangeFallbackRow?.row_code,
    revealMissingStarredPrices,
    selectedRowId
  ]);

  // Auto-calc: 500ms after the latest financially relevant change, run the official calculation
  // through the modal session. Keeps the previous result on screen (stale) while it debounces.
  useEffect(() => {
    if (showAddedRows) {
      clearPendingAutoTimer();
      return undefined;
    }

    if (!document || documentLocked || !calculationSessionId) {
      clearPendingAutoTimer();
      return undefined;
    }

    const payload = buildCalculationPayload(false);

    if (!payload.ok) {
      clearPendingAutoTimer();
      if (
        calculationRef.current !== null ||
        latestCalculatedPayloadKeyRef.current !== null ||
        currentReceipt !== null
      ) {
        clearPaidCalculation("waiting");
      } else if (calculationStatusRef.current !== "waiting") {
        setCalculationStatus("waiting");
      }
      return undefined;
    }

    const hasMatchingReadyReceipt =
      payload.key === latestCalculatedPayloadKeyRef.current &&
      calculationRef.current !== null &&
      currentReceipt !== null &&
      currentReceipt.payloadKey === payload.key;

    if (hasMatchingReadyReceipt) {
      clearPendingAutoTimer();
      if (calculationStatusRef.current !== "ready") {
        setCalculationStatus("ready");
      }
      return undefined;
    }

    // Do not re-fire the same insufficient payload every 500ms. Retry only after
    // a financially relevant input change (new payload key) or an explicit Add.
    if (insufficientBalance && insufficientBalance.payloadKey === payload.key) {
      clearPendingAutoTimer();
      if (calculationStatusRef.current !== "waiting") {
        setCalculationStatus("waiting");
      }
      return undefined;
    }

    // Mark stale but keep the previous result/layout visible until the debounced recalculation lands.
    if (calculationStatusRef.current !== "calculating") {
      setCalculationStatus("stale");
    }

    clearPendingAutoTimer();
    pendingAutoTimerRef.current = window.setTimeout(() => {
      pendingAutoTimerRef.current = null;
      void executeCalculation();
    }, AUTO_CALCULATION_DEBOUNCE_MS);

    return () => {
      clearPendingAutoTimer();
    };
  }, [
    buildCalculationPayload,
    calculationSessionId,
    clearPaidCalculation,
    clearPendingAutoTimer,
    currentReceipt,
    document,
    documentLocked,
    executeCalculation,
    insufficientBalance,
    showAddedRows
  ]);

  const handleAddLine = useCallback(async () => {
    setHasSubmitAttempted(true);
    markFootnoteInputsTouched();
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

    if (createLineState.isLoading || recalculateState.isLoading) {
      return;
    }

    const payload = buildCalculationPayload(false);
    let receipt =
      currentReceipt &&
      payload.ok &&
      currentReceipt.payloadKey === payload.key &&
      calculationStatus === "ready" &&
      calculation
        ? currentReceipt
        : null;

    if (!receipt) {
      // Already known to be insufficient for the current inputs: surface the purchase dialog
      // instead of retrying a calculation that would fail again.
      if (insufficientBalance && payload.ok && insufficientBalance.payloadKey === payload.key) {
        setShowPurchaseModal(true);
        return;
      }

      // No fresh receipt: force an immediate calculation through the same session, then add.
      clearPendingAutoTimer();
      const outcome = await executeCalculation();
      if (!outcome.ok) {
        if (outcome.reason === "insufficient") {
          setShowPurchaseModal(true);
        }
        return;
      }
      receipt = outcome.receipt;
    }

    if (lineIdempotencyRef.current?.receiptId !== receipt.id) {
      lineIdempotencyRef.current = {
        receiptId: receipt.id,
        key: createLineIdempotencyKey()
      };
    }

    const lineBody: FinancialDocumentLineCreatePayload = {
      calculation_receipt_id: receipt.id,
      idempotency_key: lineIdempotencyRef.current.key,
      ...(documentPricebookId != null
        ? { document_pricebook_id: documentPricebookId }
        : {})
    };

    try {
      const createdLine = await createFinancialDocumentLine({
        body: lineBody,
        documentId: document.id
      }).unwrap();
      lineIdempotencyRef.current = null;
      setCurrentReceipt(null);
      calculationIdempotencyRef.current = null;
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      const addedLine =
        updatedDocument.lines.find((line) => line.id === createdLine.id) ?? createdLine;
      const addedDisplayRows = getLineDisplayRows(addedLine);
      setAddedRowsLines([addedLine]);
      setHasSubmitAttempted(false);
      onToast(
        createdLine.idempotent_replayed
          ? "این ردیف قبلاً ثبت شده بود."
          : addedDisplayRows.length > 1
            ? "ردیف‌ها به صورت‌بها اضافه شدند."
            : "ردیف به صورت‌بها اضافه شد.",
        "success"
      );
      setShowAddedRows(true);
    } catch (error) {
      if (isIdempotencyKeyReused(error)) {
        lineIdempotencyRef.current = null;
        setLineError("کلید تکرار ثبت قبلاً برای درخواست دیگری استفاده شده است. دوباره تلاش کنید.");
        return;
      }
      setLineError(getApiErrorMessage(error));
    }
  }, [
    buildCalculationPayload,
    calculation,
    calculationStatus,
    clearPendingAutoTimer,
    createFinancialDocumentLine,
    createLineState.isLoading,
    currentReceipt,
    document,
    documentLocked,
    documentPricebookId,
    executeCalculation,
    insufficientBalance,
    markFootnoteInputsTouched,
    onDocumentUpdated,
    onToast,
    recalculateFinancialDocument,
    recalculateState.isLoading
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
    if (documentLocked || isAddingLine || isCalculating) {
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
  const isCalculating = calculateState.isLoading || calculationStatus === "calculating";
  const isAddingLine = createLineState.isLoading || recalculateState.isLoading;
  const hasCurrentReceipt =
    currentReceipt !== null &&
    currentPayload.ok &&
    currentReceipt.payloadKey === currentPayload.key &&
    calculationStatus === "ready" &&
    calculation !== null;
  const addLineDisabledReason = !document
    ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
    : documentLocked
      ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
      : null;
  // Add stays clickable without a receipt / on insufficient balance / while auto-calc runs;
  // only the missing/locked document or an active Add submission disables it.
  const headerAddDisabled = Boolean(addLineDisabledReason) || isAddingLine;
  const calculateCostLabel = formatCalculationCostLabel(wallet?.official_calculation_cost);
  const billingBreakdown =
    hasCurrentReceipt && currentReceipt
      ? formatBillingBreakdown(currentReceipt.billing)
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
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      <label className="flex min-w-0 items-center">
        <span className="sr-only">ضرایب</span>
        <select
          className={classNames(
            inputClasses,
            "h-10 w-full min-w-0 px-2 text-xs sm:w-40 sm:max-w-[10rem]"
          )}
          disabled={isAddingLine || isCalculating}
          onChange={(event) =>
            handleSelectedCoefficientSetIdChange(
              event.target.value ? Number(event.target.value) : null
            )
          }
          title={
            coefficientSets.length === 0
              ? "برای ساخت مجموعه ضرایب به مرحله ضرایب بروید."
              : "ضرایب"
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
        className="h-10 min-w-24 px-3 sm:min-w-28 sm:px-4"
        disabled={headerAddDisabled}
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
          <p className="text-sm leading-7 text-ui-text-secondary">
            {item.description_fa}
          </p>
        ) : null}

        {addLineDisabledReason ? (
          <p className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-sm leading-7 text-amber-100">
            {addLineDisabledReason}
          </p>
        ) : null}

        <CalculationSection
          billingBreakdown={billingBreakdown}
          calculation={calculation}
          calculationError={
            calculationStatus === "error" ? calculationError : hasSubmitAttempted ? calculationError : null
          }
          calculationStatusDot={calculationStatusDot}
          calculateCostLabel={calculateCostLabel}
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
          disabled={isAddingLine || isCalculating}
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
            <h3 className="text-xs font-black uppercase tracking-wide text-ui-text-muted">
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
                const priceControlsDisabled = documentLocked || isAddingLine || isCalculating;
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
                        ? "border-rose-400/50 bg-rose-500/8"
                        : isMissingStarredPrice
                          ? "border-amber-300/35 bg-amber-400/8"
                      : calculatedRow
                        ? "border-b-ui-primary/25 bg-ui-primary-soft before:absolute before:inset-y-1 before:right-0 before:w-0.5 before:rounded-full before:bg-ui-primary/80 md:border-ui-primary/30 md:bg-ui-primary-soft md:before:hidden"
                        : "border-b-ui-border-subtle bg-transparent md:border-ui-border-subtle md:bg-ui-surface-subtle"
                    )}
                    key={row.id}
                  >
                    <div className="md:hidden">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-ui-primary">
                            {row.row_code}
                          </span>
                          {calculatedRow ? (
                            <span className="rounded-full border border-ui-primary/30 bg-ui-primary-soft px-1.5 py-px text-[10px] font-bold text-ui-primary">
                              انتخاب‌شده
                            </span>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {isEditing ? (
                            <>
                              <MathNumericInput
                                ref={(element) => { rowPriceInputRefs.current[row.row_code] = element; }}
                                aria-label={isMissingStarredPrice ? `باید قیمت ردیف ${row.row_code} را تعیین کنید` : `ویرایش قیمت ردیف ${row.row_code}`}
                                className="h-7 w-24 max-w-[7rem] rounded-md border border-ui-border-subtle bg-ui-surface/45 px-2 text-left text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30"
                                dir="ltr"
                                disabled={priceControlsDisabled}
                                inputMode="decimal"
                                onChange={(next) =>
                                  isMissingPriceEdit
                                    ? setMissingStarredDraftPrices((current) => ({ ...current, [row.row_code]: next }))
                                    : handleEditingRowPriceChange(row.row_code, next)
                                }
                                placeholder={hasOfficialPrice ? String(row.unit_price) : "بهای واحد"}
                                value={currentEditingPrice}
                                wrapperClassName="inline-flex min-w-0 flex-col"
                              />
                              <button
                                aria-label="ثبت بهای واحد"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ui-primary transition hover:bg-ui-primary-soft hover:text-ui-primary disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={priceControlsDisabled}
                                onClick={() => applyRowCustomPrice(row.row_code, currentEditingPrice)}
                                title="ثبت بهای واحد"
                                type="button"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label="لغو ویرایش بهای واحد"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                                    ? "text-amber-200"
                                    : "text-ui-primary "
                                )}
                              >
                                {hasCustomPrice || isMissingStarredPrice ? "★ ستاره‌دار" : "قیمت رسمی"}
                              </span>
                              <span
                                className="max-w-[7rem] truncate text-left text-xs font-bold text-ui-text-secondary"
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
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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

                      <p className="mt-1 truncate text-sm font-bold leading-5 text-ui-text-primary">
                        {rowTitle}
                      </p>
                      {mobileDescription ? (
                        <p className="mt-0.5 truncate text-xs leading-4 text-ui-text-muted">
                          {mobileDescription}
                        </p>
                      ) : null}
                      {calculatedRow ? (
                        <p className="mt-1 truncate text-xs font-medium leading-4 text-ui-primary">
                          مقدار: {formatDecimal(calculatedRow.quantity)}{" "}
                          {calculatedRow.unit ?? row.unit} · مبلغ:{" "}
                          {formatMoneyAmount(calculatedRow.total)}
                        </p>
                      ) : null}
                    </div>

                    <div className="hidden gap-x-3 gap-y-2 md:grid md:grid-cols-[6rem_minmax(0,1fr)_5rem_minmax(13rem,auto)] md:items-center">
                      <span className="font-mono font-bold text-ui-primary">
                        {row.row_code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ui-text-primary">
                          {rowTitle}
                        </p>
                        {row.description_fa ? (
                          <p className="mt-0.5 truncate text-xs text-ui-text-muted">
                            {row.description_fa}
                          </p>
                        ) : null}
                        {(row.min_value || row.max_value) ? (
                          <p className="mt-0.5 text-xs text-ui-text-muted">
                            {row.min_value ? `از: ${formatDecimal(row.min_value)}` : null}
                            {row.min_value && row.max_value ? " / " : null}
                            {row.max_value ? `تا: ${formatDecimal(row.max_value)}` : null}
                          </p>
                        ) : null}
                        {calculatedRow ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full border border-ui-primary/35 bg-ui-primary-soft px-2 py-0.5 font-bold text-ui-primary">
                              در محاسبه
                            </span>
                            <span className="text-ui-text-secondary">
                              مقدار: {formatDecimal(calculatedRow.quantity)}{" "}
                              {calculatedRow.unit ?? row.unit}
                            </span>
                            <span className="font-bold text-ui-text-secondary">
                              مبلغ: {formatMoneyAmount(calculatedRow.total)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <span className="text-ui-text-muted">{row.unit}</span>
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 md:justify-end">
                        {isEditing ? (
                          <>
                              <MathNumericInput
                              ref={(element) => { rowPriceInputRefs.current[row.row_code] = element; }}
                              aria-label={isMissingStarredPrice ? `باید قیمت ردیف ${row.row_code} را تعیین کنید` : `ویرایش قیمت ردیف ${row.row_code}`}
                              className="h-8 w-32 rounded-md border border-ui-border-subtle bg-ui-surface/45 px-2 text-left text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30"
                              dir="ltr"
                              disabled={priceControlsDisabled}
                              inputMode="decimal"
                              onChange={(next) =>
                                isMissingPriceEdit
                                  ? setMissingStarredDraftPrices((current) => ({ ...current, [row.row_code]: next }))
                                  : handleEditingRowPriceChange(row.row_code, next)
                              }
                              placeholder={hasOfficialPrice ? String(row.unit_price) : "بهای واحد"}
                              value={currentEditingPrice}
                              wrapperClassName="inline-flex min-w-0 flex-col"
                            />
                            <button
                              aria-label="ثبت بهای واحد"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ui-primary transition hover:bg-ui-primary-soft hover:text-ui-primary disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={priceControlsDisabled}
                              onClick={() => applyRowCustomPrice(row.row_code, currentEditingPrice)}
                              title="ثبت بهای واحد"
                              type="button"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              aria-label="لغو ویرایش بهای واحد"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                                  ? "border-amber-300/35 bg-amber-400/15 text-amber-100"
                                  : "border-ui-primary/30 bg-ui-primary-soft text-ui-primary "
                              )}
                            >
                              {hasCustomPrice || isMissingStarredPrice ? "★ ستاره‌دار" : "قیمت رسمی"}
                            </span>
                            <span
                              className="font-bold text-ui-text-secondary"
                              title={
                                isMissingStarredPrice
                                  ? "باید قیمت این ردیف را تعیین کنید."
                                  : displayPrice
                              }
                            >
                              {displayPrice}
                            </span>
                            {hasCustomPrice ? (
                              <span className="text-xs text-ui-text-muted">
                                رسمی: {officialPriceLabel}
                              </span>
                            ) : null}
                            <button
                              aria-label="ویرایش بهای واحد"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="mt-2 rounded-md border border-amber-300/35 bg-amber-400/12 px-2.5 py-2 text-xs font-bold leading-5 text-amber-100 shadow-lg md:mr-auto md:max-w-sm"
                        role="tooltip"
                      >
                        برای ادامه، روی مداد بزنید و قیمت این ردیف را وارد کنید.
                      </div>
                    ) : null}
                    {customPriceErrors[row.row_code] ? (
                      <p className="mt-1 text-xs text-rose-300">
                        {customPriceErrors[row.row_code]}
                      </p>
                    ) : null}
                    {isMissingStarredPrice && !customPriceErrors[row.row_code] ? (
                      <p
                        aria-label={`باید قیمت ردیف ${row.row_code} را تعیین کنید`}
                        className="mt-1 text-xs text-amber-200"
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
      {showPurchaseModal && insufficientBalance ? (
        <InsufficientTokenModal
          error={insufficientBalance.error}
          onClose={() => setShowPurchaseModal(false)}
          purchaseOrigin={{
            companyId: document?.company_id,
            financialDocumentId: document?.id,
            pricebookItemId: item.id
          }}
        />
      ) : null}
    </div>
  );
}

export function ItemDetailModal({
  coefficientSets,
  document,
  documentPricebookId,
  itemId,
  onClose,
  onDocumentUpdated,
  onSelectedCoefficientSetIdChange,
  onToast,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  documentPricebookId?: number | null;
  itemId: number;
  onClose: () => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
  selectedCoefficientSetId: number | null;
}) {
  const { data: item, error, isLoading } = useRetrievePricebookItemQuery(itemId);
  const { secondaryNav } = useAppShell();

  useEscapeLayer(onClose, true, "item-detail-modal");

  return (
    <div
      className={classNames(
        "fixed inset-0 z-[100] flex items-center justify-center bg-ui-overlay p-3 backdrop-blur-sm sm:p-4",
        secondaryNav ? "lg:right-[19rem]" : "lg:right-20"
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-lg border border-ui-border-subtle bg-ui-surface shadow-ui"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {item ? (
          <ItemDetailContent
            coefficientSets={coefficientSets}
            document={document}
            documentPricebookId={documentPricebookId ?? null}
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
                <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-bold text-ui-text-secondary">
                  <Loader2 className="h-5 w-5 animate-spin text-ui-primary" />
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
