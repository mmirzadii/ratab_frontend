import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Trash2, X, XCircle } from "lucide-react";

import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import {
  useCalculatePricebookItemMutation,
  useRetrievePricebookItemQuery,
  type PricebookCalculateInputRequest,
  type PricebookCalculateResponse,
  type PricebookItemDetail
} from "../../pricebooks/pricebookApi";
import {
  type FinancialDocumentLineCreateRequest,
  useCreateFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import { EmptyState } from "../../../shared/components/EmptyState";
import { cleanDisplayText, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { classNames } from "../../../shared/utils/classNames";
import {
  classifyPricebookItem,
  findMatchedRangeRow,
  getManualPriceValidationMessage,
  hasManualUnitPrice,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue,
  parseItemizedOptions,
  parsePriceRanges,
  requiresRowSelection
} from "../costReportUtils";
import { CalculationSection } from "./CalculationSection";
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
        <h3 className="text-lg font-black text-white light:text-slate-950">ردیف‌های اضافه‌شده</h3>
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
                <span>مقدار: {line.quantity}</span>
                <span>جمع: {formatMoneyAmount(line.total_amount_snapshot)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                aria-label="ویرایش"
                className="p-1.5 rounded-lg text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-400"
                onClick={() => onToast("ویرایش در نسخه بعدی")}
                title="ویرایش"
                type="button"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label="حذف"
                className="p-1.5 rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                onClick={() =>
                  setLocalLines((current) => current.filter((l) => l.id !== line.id))
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
  // ── Stable item-derived values (pure, no hooks) ──────────────────────────
  const itemType = classifyPricebookItem(item);
  const parsedItemizedOptions = itemType === "itemized" ? parseItemizedOptions(item.itemized_options) : null;

  // ── State ─────────────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState("1");
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [inputErrors, setInputErrors] = useState<Record<number, string | null>>({});
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [manualUnitPriceError, setManualUnitPriceError] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<PricebookCalculateResponse | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);
  const [lineSuccess, setLineSuccess] = useState<string | null>(null);
  const [confirmedFootnotes, setConfirmedFootnotes] = useState<Record<string, boolean>>({});
  const [showAddedRows, setShowAddedRows] = useState(false);
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();

  // ── Derived flags ─────────────────────────────────────────────────────────
  const requiresManualPrice = hasManualUnitPrice(item);
  const needsRowSelection = requiresRowSelection(item);
  const documentLocked = isFinancialDocumentLocked(document);
  const isCalculationLocked = Boolean(calculation);
  // Itemized uses its own picker (from itemized_options); v1 row picker only for non-itemized
  const showItemizedPicker = itemType === "itemized";
  const showRowPicker = needsRowSelection && !showItemizedPicker;

  // ── Range-based: real-time row matching (useMemo before early return) ─────
  const matchedRangeRow = useMemo(() => {
    if (itemType !== "range-based") return null;
    const priceRanges = parsePriceRanges(item.price_ranges);
    if (!priceRanges) return null;

    let drivingValue: string | null = null;
    if (item.inputs && item.inputs.length > 0) {
      const drivingInput = item.inputs.find((inp) => inp.value_key === priceRanges.value_key);
      if (drivingInput) {
        const v = normalizeQuantityValue(inputValues[drivingInput.value_key] ?? "");
        if (isPositiveDecimal(v)) drivingValue = v;
      }
    } else {
      const v = normalizeQuantityValue(quantity);
      if (isPositiveDecimal(v)) drivingValue = v;
    }

    if (drivingValue === null) return null;
    return findMatchedRangeRow(priceRanges, drivingValue, item.rows);
  }, [itemType, item.price_ranges, item.inputs, item.rows, inputValues, quantity]);

  // Show error only when a valid value is entered but falls outside all ranges
  const hasDrivingValueForRange = (() => {
    if (itemType !== "range-based") return false;
    const priceRanges = parsePriceRanges(item.price_ranges);
    if (!priceRanges) return false;
    if (item.inputs && item.inputs.length > 0) {
      const inp = item.inputs.find((i) => i.value_key === priceRanges.value_key);
      if (!inp) return false;
      return isPositiveDecimal(normalizeQuantityValue(inputValues[inp.value_key] ?? ""));
    }
    return isPositiveDecimal(normalizeQuantityValue(quantity));
  })();
  const rangeMatchError =
    itemType === "range-based" && hasDrivingValueForRange && matchedRangeRow === null
      ? "مقدار وارد‌شده با هیچ بازه قیمتی تطابق ندارد."
      : null;

  // ── Early return ──────────────────────────────────────────────────────────
  if (showAddedRows) {
    return <AddedRowsView document={document} onClose={onClose} onToast={onToast} />;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleInputValueChange(key: number, value: string) {
    setInputValues((current) => ({ ...current, [key]: value }));
    setInputErrors((current) => ({ ...current, [key]: null }));
  }

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuantityError(null);
    setManualUnitPriceError(null);
    setCalculationError(null);
    setLineError(null);
    setLineSuccess(null);
    setCalculation(null);
    setInputErrors({});

    const calculateBody: PricebookCalculateInputRequest = {};

    if (itemType === "multi-input") {
      // Validate and build values[]
      const newErrors: Record<number, string | null> = {};
      let hasError = false;
      for (const input of item.inputs) {
        const normalized = normalizeQuantityValue(inputValues[input.value_key] ?? "");
        if (!isPositiveDecimal(normalized)) {
          newErrors[input.value_key] = `${input.label_fa} باید یک عدد مثبت باشد.`;
          hasError = true;
          continue;
        }
        if (input.min_value !== null && Number(normalized) < Number(input.min_value)) {
          newErrors[input.value_key] = `حداقل مقدار ${input.label_fa}: ${input.min_value}`;
          hasError = true;
          continue;
        }
        if (input.max_value !== null && Number(normalized) > Number(input.max_value)) {
          newErrors[input.value_key] = `حداکثر مقدار ${input.label_fa}: ${input.max_value}`;
          hasError = true;
        }
      }
      if (hasError) {
        setInputErrors(newErrors);
        return;
      }
      calculateBody.values = item.inputs.map((inp) =>
        normalizeQuantityValue(inputValues[inp.value_key] ?? "")
      );
    } else if (itemType === "range-based") {
      // Range-based: send quantity (or values[]) + selected_row_id from matched range
      if (!matchedRangeRow) {
        setCalculationError(
          hasDrivingValueForRange
            ? "مقدار وارد‌شده با هیچ بازه قیمتی تطابق ندارد."
            : "مقدار را وارد کنید تا ردیف بازه‌ای انتخاب شود."
        );
        return;
      }
      if (item.inputs && item.inputs.length > 0) {
        // Validate all inputs, send values[]
        const newErrors: Record<number, string | null> = {};
        let hasError = false;
        for (const input of item.inputs) {
          const normalized = normalizeQuantityValue(inputValues[input.value_key] ?? "");
          if (!isPositiveDecimal(normalized)) {
            newErrors[input.value_key] = `${input.label_fa} باید یک عدد مثبت باشد.`;
            hasError = true;
          }
        }
        if (hasError) {
          setInputErrors(newErrors);
          return;
        }
        calculateBody.values = item.inputs.map((inp) =>
          normalizeQuantityValue(inputValues[inp.value_key] ?? "")
        );
      } else {
        const normalizedQuantity = normalizeQuantityValue(quantity);
        if (!isPositiveDecimal(normalizedQuantity)) {
          setQuantityError("مقدار باید یک عدد مثبت باشد.");
          return;
        }
        calculateBody.quantity = normalizedQuantity;
      }
      calculateBody.selected_row_id = matchedRangeRow.id;
    } else {
      // v1 single / itemized (quantity field)
      const normalizedQuantity = normalizeQuantityValue(quantity);
      if (!isPositiveDecimal(normalizedQuantity)) {
        setQuantityError("مقدار باید یک عدد مثبت باشد.");
        return;
      }
      calculateBody.quantity = normalizedQuantity;
    }

    if (showRowPicker && selectedRowId === null) {
      setCalculationError("ابتدا یک ردیف از لیست زیر انتخاب کنید.");
      return;
    }
    if (showItemizedPicker && selectedRowId === null) {
      setCalculationError("ابتدا یک گزینه از لیست زیر انتخاب کنید.");
      return;
    }

    let normalizedManualPrice: string | undefined;
    if (requiresManualPrice) {
      const normalized = normalizeQuantityValue(manualUnitPrice);
      if (!isPositiveDecimal(normalized)) {
        setManualUnitPriceError("قیمت واحد باید یک عدد مثبت وارد شود.");
        return;
      }
      normalizedManualPrice = normalized;
    }

    if (selectedCoefficientSetId) {
      calculateBody.coefficient_set_id = selectedCoefficientSetId;
    }
    if (normalizedManualPrice !== undefined) {
      calculateBody.manual_unit_price = normalizedManualPrice;
    }
    if (showRowPicker && selectedRowId !== null) {
      calculateBody.pricebook_row_id = selectedRowId;
    }
    if (showItemizedPicker && selectedRowId !== null) {
      calculateBody.selected_row_id = selectedRowId;
    }

    if (Object.keys(confirmedFootnotes).length > 0) {
      calculateBody.footnotes = confirmedFootnotes;
    }

    try {
      const result = await calculatePricebookItem({
        itemId: item.id,
        body: calculateBody
      }).unwrap();
      if (itemType === "single") {
        setQuantity(calculateBody.quantity ?? quantity);
      }
      setCalculation(result);
    } catch (error) {
      setCalculationError(getManualPriceValidationMessage(error));
    }
  }

  function handleEditCalculation() {
    setCalculation(null);
    setCalculationError(null);
    setLineError(null);
    setLineSuccess(null);
    setManualUnitPriceError(null);
  }

  async function handleAddLine() {
    setLineError(null);
    setLineSuccess(null);

    if (!calculation) {
      setLineError("ابتدا آیتم را محاسبه کنید.");
      return;
    }
    if (!document) {
      setLineError(
        "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
      );
      return;
    }
    if (documentLocked) {
      setLineError("این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد.");
      return;
    }

    const lineBody: FinancialDocumentLineCreateRequest = {
      pricebook_item_id: item.id,
      quantity: calculation.quantity
    };

    if (requiresManualPrice) {
      const normalized = normalizeQuantityValue(manualUnitPrice);
      if (isPositiveDecimal(normalized)) {
        lineBody.manual_unit_price = normalized;
      }
    }

    if (itemType === "multi-input") {
      lineBody.values = item.inputs.map((inp) =>
        normalizeQuantityValue(inputValues[inp.value_key] ?? "")
      );
    } else if (itemType === "range-based") {
      if (item.inputs && item.inputs.length > 0) {
        lineBody.values = item.inputs.map((inp) =>
          normalizeQuantityValue(inputValues[inp.value_key] ?? "")
        );
      }
      if (matchedRangeRow) {
        lineBody.selected_row_id = matchedRangeRow.id;
      }
    } else if (showRowPicker && selectedRowId !== null) {
      lineBody.pricebook_row_id = selectedRowId;
    } else if (showItemizedPicker && selectedRowId !== null) {
      lineBody.selected_row_id = selectedRowId;
    }

    if (Object.keys(confirmedFootnotes).length > 0) {
      lineBody.footnotes = confirmedFootnotes;
    }

    try {
      await createFinancialDocumentLine({
        documentId: document.id,
        body: lineBody
      }).unwrap();
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
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
  }

  const addLineDisabledReason =
    (showRowPicker || showItemizedPicker) && selectedRowId === null
      ? showItemizedPicker
        ? "ابتدا یک گزینه از لیست زیر انتخاب کنید."
        : "ابتدا یک ردیف از لیست زیر انتخاب کنید."
      : !calculation
        ? "بعد از محاسبه موفق می‌توانید آیتم را به صورت‌بها اضافه کنید."
        : !document
          ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
          : documentLocked
            ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
            : null;

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {item.description_fa ? (
        <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
          {item.description_fa}
        </p>
      ) : null}

      {/* Itemized picker — uses itemized_options dict for distinct labels */}
      {showItemizedPicker ? (
        <section className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 light:bg-amber-50">
          <h3 className="text-base font-black text-white light:text-slate-950">انتخاب گزینه</h3>
          <p className="mt-2 text-sm leading-7 text-amber-100 light:text-amber-800">
            یکی از گزینه‌های زیر را انتخاب کنید.
          </p>
          <div className="mt-3 space-y-2">
            {parsedItemizedOptions !== null
              ? Object.entries(parsedItemizedOptions).map(([rowCode, option]) => {
                  const row = item.rows.find((r) => r.row_code === rowCode);
                  if (!row) return null;
                  return (
                    <label
                      key={row.id}
                      className={classNames(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                        selectedRowId === row.id
                          ? "border-emerald-400/50 bg-emerald-400/15 light:border-emerald-500 light:bg-emerald-50"
                          : "border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-200 light:bg-white light:hover:bg-slate-50"
                      )}
                    >
                      <input
                        checked={selectedRowId === row.id}
                        className="mt-0.5 shrink-0 accent-emerald-400"
                        disabled={isCalculationLocked}
                        name="itemized_option"
                        onChange={() => {
                          setSelectedRowId(row.id);
                          setCalculation(null);
                          setCalculationError(null);
                        }}
                        type="radio"
                        value={row.id}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-100 light:text-slate-900">
                          {option.short_name_fa}
                        </p>
                        {option.description_fa ? (
                          <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
                            {option.description_fa}
                          </p>
                        ) : null}
                        <p className="mt-1 font-mono text-xs text-emerald-200 light:text-emerald-700">
                          {row.row_code}
                        </p>
                      </div>
                    </label>
                  );
                })
              : /* Fallback: itemized_options absent — show rows[] directly */
                item.rows.map((row) => (
                  <label
                    key={row.id}
                    className={classNames(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                      selectedRowId === row.id
                        ? "border-emerald-400/50 bg-emerald-400/15 light:border-emerald-500 light:bg-emerald-50"
                        : "border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-200 light:bg-white light:hover:bg-slate-50"
                    )}
                  >
                    <input
                      checked={selectedRowId === row.id}
                      className="mt-0.5 shrink-0 accent-emerald-400"
                      disabled={isCalculationLocked}
                      name="itemized_option"
                      onChange={() => {
                        setSelectedRowId(row.id);
                        setCalculation(null);
                        setCalculationError(null);
                      }}
                      type="radio"
                      value={row.id}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-emerald-200 light:text-emerald-700">
                          {row.row_code}
                        </span>
                        <span className="text-sm text-slate-200 light:text-slate-800">
                          {row.title_fa || row.short_title_fa}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400 light:text-slate-500">
                        <span>واحد: {row.unit}</span>
                        {row.unit_price ? (
                          <span>قیمت: {formatMoneyAmount(row.unit_price)}</span>
                        ) : (
                          <span className="text-amber-300 light:text-amber-700">قیمت دستی</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
          </div>
        </section>
      ) : null}

      {/* v1 row picker (non-itemized items that require_row_selection) */}
      {showRowPicker ? (
        <section className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 light:bg-amber-50">
          <h3 className="text-base font-black text-white light:text-slate-950">انتخاب ردیف</h3>
          <p className="mt-2 text-sm leading-7 text-amber-100 light:text-amber-800">
            این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید.
          </p>
          <div className="mt-3 space-y-2">
            {item.rows.map((row) => (
              <label
                key={row.id}
                className={classNames(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                  selectedRowId === row.id
                    ? "border-emerald-400/50 bg-emerald-400/15 light:border-emerald-500 light:bg-emerald-50"
                    : "border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-200 light:bg-white light:hover:bg-slate-50"
                )}
              >
                <input
                  checked={selectedRowId === row.id}
                  className="mt-0.5 shrink-0 accent-emerald-400"
                  disabled={isCalculationLocked}
                  name="pricebook_row"
                  onChange={() => {
                    setSelectedRowId(row.id);
                    setCalculation(null);
                    setCalculationError(null);
                  }}
                  type="radio"
                  value={row.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-emerald-200 light:text-emerald-700">
                      {row.row_code}
                    </span>
                    <span className="text-sm text-slate-200 light:text-slate-800">
                      {row.title_fa || row.short_title_fa}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400 light:text-slate-500">
                    <span>واحد: {row.unit}</span>
                    {row.unit_price ? (
                      <span>قیمت: {formatMoneyAmount(row.unit_price)}</span>
                    ) : (
                      <span className="text-amber-300 light:text-amber-700">قیمت دستی</span>
                    )}
                    {row.min_value ? <span>از: {row.min_value}</span> : null}
                    {row.max_value ? <span>تا: {row.max_value}</span> : null}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <CalculationSection
        addLineDisabledReason={addLineDisabledReason}
        calculation={calculation}
        calculationError={calculationError}
        coefficientSets={coefficientSets}
        inputErrors={
          itemType === "multi-input" || itemType === "range-based" ? inputErrors : undefined
        }
        inputs={
          itemType === "multi-input" || itemType === "range-based"
            ? item.inputs.length > 0
              ? item.inputs
              : undefined
            : undefined
        }
        inputValues={
          itemType === "multi-input" || itemType === "range-based" ? inputValues : undefined
        }
        isCalculating={calculateState.isLoading}
        isRangeBased={itemType === "range-based"}
        matchedRangeRow={itemType === "range-based" ? matchedRangeRow : undefined}
        onCalculate={handleCalculate}
        onInputValueChange={
          itemType === "multi-input" || itemType === "range-based"
            ? handleInputValueChange
            : undefined
        }
        onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
        quantity={quantity}
        quantityError={quantityError}
        rangeMatchError={itemType === "range-based" ? rangeMatchError : undefined}
        requiresManualPrice={requiresManualPrice}
        requiresRowSelection={needsRowSelection}
        isAddingLine={createLineState.isLoading || recalculateState.isLoading}
        lineError={lineError}
        lineSuccess={lineSuccess}
        manualUnitPrice={manualUnitPrice}
        manualUnitPriceError={manualUnitPriceError}
        onAddLine={handleAddLine}
        canAddLine={!addLineDisabledReason}
        isCalculationLocked={isCalculationLocked}
        onEditCalculation={handleEditCalculation}
        selectedCoefficientSetId={selectedCoefficientSetId}
        setManualUnitPrice={setManualUnitPrice}
        setQuantity={setQuantity}
      />

      <ChecklistNotesSection
        disabled={isCalculationLocked}
        notes={item.footnotes}
        onToggle={(noteCode, checked) =>
          setConfirmedFootnotes((current) => ({ ...current, [noteCode]: checked }))
        }
        selectedNotes={confirmedFootnotes}
      />

      {/* Read-only row display for items that don't have a picker */}
      {!showRowPicker && !showItemizedPicker && item.rows.length > 0 ? (
        <section>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">
            ردیف فهرست‌بها
          </h3>
          <div className="mt-2 space-y-2">
            {item.rows.map((row) => (
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-white/7 px-3 py-2.5 text-sm light:border-slate-200 light:bg-slate-50"
                key={row.id}
              >
                <span className="font-mono font-bold text-emerald-200 light:text-emerald-700">
                  {row.row_code}
                </span>
                <span className="flex-1 text-slate-100 light:text-slate-800">
                  {row.title_fa || row.short_title_fa}
                </span>
                <span className="text-slate-400 light:text-slate-500">{row.unit}</span>
                <span className="font-bold text-slate-200 light:text-slate-700">
                  {row.requires_manual_unit_price
                    ? "قیمت دستی"
                    : formatMoneyAmount(row.unit_price)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ReadableNotesSection notes={item.requirements} title="الزامات" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="max-h-[85dvh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-slate-950 shadow-2xl light:border-slate-200 light:bg-white"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/95 p-5 light:border-slate-200 light:bg-white/95">
          <h2 className="text-xl font-black text-white light:text-slate-950">
            {item?.short_name_fa ?? "جزئیات آیتم"}
          </h2>
          <button
            aria-label="بستن"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
