import { type FormEvent, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import type { ExcelPlanItem, FinancialDocumentLineCreateRequest } from "../../financialDocuments/financialDocumentApi";
import {
  useCalculatePricebookItemMutation,
  useRetrievePricebookItemQuery,
  type PricebookCalculateInputRequest,
  type PricebookCalculateResponse,
  type PricebookItemDetail
} from "../../pricebooks/pricebookApi";
import { CalculationSection } from "../components/CalculationSection";
import { ChecklistNotesSection } from "../components/ItemNotesSections";
import {
  classifyPricebookItem,
  findMatchedRangeRow,
  getManualPriceValidationMessage,
  hasManualUnitPrice,
  isPositiveDecimal,
  normalizeQuantityValue,
  parseItemizedOptions,
  parsePriceRanges,
  requiresRowSelection
} from "../costReportUtils";
import { classNames } from "../../../shared/utils/classNames";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

function AmbiguityContent({
  coefficientSets,
  item,
  planItem,
  selectedCoefficientSetId,
  onSelectedCoefficientSetIdChange,
  onResolved,
  onSkip,
  progress
}: {
  coefficientSets: ProjectCoefficientSet[];
  item: PricebookItemDetail;
  planItem: ExcelPlanItem;
  selectedCoefficientSetId: number | null;
  onSelectedCoefficientSetIdChange: (id: number | null) => void;
  onResolved: (payload: FinancialDocumentLineCreateRequest) => void;
  onSkip: () => void;
  progress: string;
}) {
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
  const [confirmedFootnotes, setConfirmedFootnotes] = useState<Record<string, boolean>>({});
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();

  const itemType = classifyPricebookItem(item);
  const parsedItemizedOptions = itemType === "itemized" ? parseItemizedOptions(item.itemized_options) : null;
  const requiresManualPrice = hasManualUnitPrice(item);
  const needsRowSelection = requiresRowSelection(item);
  const showItemizedPicker = itemType === "itemized";
  const showRowPicker = needsRowSelection && !showItemizedPicker;
  const isCalculationLocked = Boolean(calculation);

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
  }, [itemType, item, inputValues, quantity]);

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

  function handleInputValueChange(key: number, value: string) {
    setInputValues((c) => ({ ...c, [key]: value }));
    setInputErrors((c) => ({ ...c, [key]: null }));
  }

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuantityError(null);
    setManualUnitPriceError(null);
    setCalculationError(null);
    setLineError(null);
    setCalculation(null);
    setInputErrors({});

    const calculateBody: PricebookCalculateInputRequest = {};

    if (itemType === "multi-input") {
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
      if (hasError) { setInputErrors(newErrors); return; }
      calculateBody.values = item.inputs.map((inp) =>
        normalizeQuantityValue(inputValues[inp.value_key] ?? "")
      );
    } else if (itemType === "range-based") {
      if (!matchedRangeRow) {
        setCalculationError(
          hasDrivingValueForRange
            ? "مقدار وارد‌شده با هیچ بازه قیمتی تطابق ندارد."
            : "مقدار را وارد کنید تا ردیف بازه‌ای انتخاب شود."
        );
        return;
      }
      if (item.inputs && item.inputs.length > 0) {
        const newErrors: Record<number, string | null> = {};
        let hasError = false;
        for (const input of item.inputs) {
          const normalized = normalizeQuantityValue(inputValues[input.value_key] ?? "");
          if (!isPositiveDecimal(normalized)) {
            newErrors[input.value_key] = `${input.label_fa} باید یک عدد مثبت باشد.`;
            hasError = true;
          }
        }
        if (hasError) { setInputErrors(newErrors); return; }
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

    if (requiresManualPrice) {
      const normalized = normalizeQuantityValue(manualUnitPrice);
      if (!isPositiveDecimal(normalized)) {
        setManualUnitPriceError("قیمت واحد باید یک عدد مثبت وارد شود.");
        return;
      }
      calculateBody.manual_unit_price = normalized;
    }

    if (selectedCoefficientSetId) calculateBody.coefficient_set_id = selectedCoefficientSetId;
    if (showRowPicker && selectedRowId !== null) calculateBody.pricebook_row_id = selectedRowId;
    if (showItemizedPicker && selectedRowId !== null) calculateBody.selected_row_id = selectedRowId;
    if (Object.keys(confirmedFootnotes).length > 0) calculateBody.footnotes = confirmedFootnotes;

    try {
      const result = await calculatePricebookItem({ itemId: item.id, body: calculateBody }).unwrap();
      if (itemType === "single") setQuantity(calculateBody.quantity ?? quantity);
      setCalculation(result);
    } catch (err) {
      setCalculationError(getManualPriceValidationMessage(err));
    }
  }

  function handleEditCalculation() {
    setCalculation(null);
    setCalculationError(null);
    setLineError(null);
    setManualUnitPriceError(null);
  }

  function handleResolve() {
    if (!calculation) { setLineError("ابتدا آیتم را محاسبه کنید."); return; }
    const payload: FinancialDocumentLineCreateRequest = {
      pricebook_item_id: item.id,
      quantity: calculation.quantity
    };
    if (requiresManualPrice) {
      const normalized = normalizeQuantityValue(manualUnitPrice);
      if (isPositiveDecimal(normalized)) payload.manual_unit_price = normalized;
    }
    if (itemType === "multi-input") {
      payload.values = item.inputs.map((inp) =>
        normalizeQuantityValue(inputValues[inp.value_key] ?? "")
      );
    } else if (itemType === "range-based") {
      if (item.inputs && item.inputs.length > 0) {
        payload.values = item.inputs.map((inp) =>
          normalizeQuantityValue(inputValues[inp.value_key] ?? "")
        );
      }
      if (matchedRangeRow) payload.selected_row_id = matchedRangeRow.id;
    } else if (showRowPicker && selectedRowId !== null) {
      payload.pricebook_row_id = selectedRowId;
    } else if (showItemizedPicker && selectedRowId !== null) {
      payload.selected_row_id = selectedRowId;
    }
    if (Object.keys(confirmedFootnotes).length > 0) payload.footnotes = confirmedFootnotes;
    onResolved(payload);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 light:text-slate-500">{progress}</p>
          <h3 className="mt-1 text-base font-black text-white light:text-slate-950">
            {item.short_name_fa || planItem.description_fa}
          </h3>
          <p className="mt-0.5 text-sm text-slate-400 light:text-slate-500 line-clamp-2">
            {item.description_fa}
          </p>
        </div>
        <button
          className="shrink-0 text-sm text-slate-400 underline hover:text-slate-200 light:text-slate-500 light:hover:text-slate-700"
          onClick={onSkip}
          type="button"
        >
          رد کردن
        </button>
      </div>

      {showItemizedPicker ? (
        <section className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 light:bg-amber-50">
          <h3 className="text-base font-black text-white light:text-slate-950">انتخاب گزینه</h3>
          <div className="mt-3 space-y-2">
            {(parsedItemizedOptions
              ? Object.entries(parsedItemizedOptions).map(([rowCode, opt]) => {
                  const row = item.rows.find((r) => r.row_code === rowCode);
                  if (!row) return null;
                  return { row, label: opt.short_name_fa, sub: opt.description_fa };
                }).filter(Boolean)
              : item.rows.map((row) => ({ row, label: row.title_fa || row.short_title_fa, sub: "" }))
            ).map((entry) => {
              if (!entry) return null;
              const { row, label, sub } = entry;
              return (
                <label
                  className={classNames(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                    selectedRowId === row.id
                      ? "border-emerald-400/50 bg-emerald-400/15 light:border-emerald-500 light:bg-emerald-50"
                      : "border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-200 light:bg-white light:hover:bg-slate-50"
                  )}
                  key={row.id}
                >
                  <input
                    checked={selectedRowId === row.id}
                    className="mt-0.5 shrink-0 accent-emerald-400"
                    disabled={isCalculationLocked}
                    name="itemized_option"
                    onChange={() => { setSelectedRowId(row.id); setCalculation(null); setCalculationError(null); }}
                    type="radio"
                    value={row.id}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-100 light:text-slate-900">{label}</p>
                    {sub ? <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">{sub}</p> : null}
                    <p className="mt-1 font-mono text-xs text-emerald-200 light:text-emerald-700">{row.row_code}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      ) : null}

      {showRowPicker ? (
        <section className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 light:bg-amber-50">
          <h3 className="text-base font-black text-white light:text-slate-950">انتخاب ردیف</h3>
          <p className="mt-2 text-sm leading-7 text-amber-100 light:text-amber-800">
            این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید.
          </p>
          <div className="mt-3 space-y-2">
            {item.rows.map((row) => (
              <label
                className={classNames(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                  selectedRowId === row.id
                    ? "border-emerald-400/50 bg-emerald-400/15 light:border-emerald-500 light:bg-emerald-50"
                    : "border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-200 light:bg-white light:hover:bg-slate-50"
                )}
                key={row.id}
              >
                <input
                  checked={selectedRowId === row.id}
                  className="mt-0.5 shrink-0 accent-emerald-400"
                  disabled={isCalculationLocked}
                  name="pricebook_row"
                  onChange={() => { setSelectedRowId(row.id); setCalculation(null); setCalculationError(null); }}
                  type="radio"
                  value={row.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-emerald-200 light:text-emerald-700">{row.row_code}</span>
                    <span className="text-sm text-slate-200 light:text-slate-800">{row.title_fa || row.short_title_fa}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400 light:text-slate-500">
                    <span>واحد: {row.unit}</span>
                    {row.unit_price
                      ? <span>قیمت: {formatMoneyAmount(row.unit_price)}</span>
                      : <span className="text-amber-300 light:text-amber-700">قیمت دستی</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {item.footnotes.length > 0 ? (
        <ChecklistNotesSection
          disabled={isCalculationLocked}
          notes={item.footnotes}
          onToggle={(code, checked) =>
            setConfirmedFootnotes((c) => ({ ...c, [code]: checked }))
          }
          selectedNotes={confirmedFootnotes}
        />
      ) : null}

      <CalculationSection
        addLineDisabledReason={
          (showRowPicker || showItemizedPicker) && selectedRowId === null
            ? showItemizedPicker ? "ابتدا یک گزینه از لیست زیر انتخاب کنید." : "ابتدا یک ردیف از لیست زیر انتخاب کنید."
            : !calculation ? "ابتدا محاسبه کنید." : null
        }
        calculation={calculation}
        calculationError={calculationError}
        canAddLine={Boolean(calculation)}
        coefficientSets={coefficientSets}
        inputErrors={inputErrors}
        inputs={item.inputs}
        inputValues={inputValues}
        isAddingLine={false}
        isCalculating={calculateState.isLoading}
        isCalculationLocked={isCalculationLocked}
        isRangeBased={itemType === "range-based"}
        lineError={lineError}
        lineSuccess={null}
        manualUnitPrice={manualUnitPrice}
        manualUnitPriceError={manualUnitPriceError}
        matchedRangeRow={matchedRangeRow}
        onAddLine={handleResolve}
        onCalculate={handleCalculate}
        onEditCalculation={handleEditCalculation}
        onInputValueChange={handleInputValueChange}
        onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
        quantity={quantity}
        quantityError={quantityError}
        rangeMatchError={rangeMatchError}
        requiresManualPrice={requiresManualPrice}
        requiresRowSelection={needsRowSelection}
        selectedCoefficientSetId={selectedCoefficientSetId}
        setManualUnitPrice={setManualUnitPrice}
        setQuantity={setQuantity}
      />
    </div>
  );
}

export function AmbiguityStep({
  coefficientSets,
  planItem,
  selectedCoefficientSetId,
  onSelectedCoefficientSetIdChange,
  onResolved,
  onSkip,
  progress
}: {
  coefficientSets: ProjectCoefficientSet[];
  planItem: ExcelPlanItem;
  selectedCoefficientSetId: number | null;
  onSelectedCoefficientSetIdChange: (id: number | null) => void;
  onResolved: (payload: FinancialDocumentLineCreateRequest) => void;
  onSkip: () => void;
  progress: string;
}) {
  const { data: item, isLoading, error } = useRetrievePricebookItemQuery(planItem.pricebook_item_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }
  if (error || !item) {
    return (
      <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-8 text-center text-sm text-rose-200 light:border-rose-300 light:bg-rose-50 light:text-rose-700">
        <AlertCircle className="mx-auto mb-2 h-6 w-6" />
        {getApiErrorMessage(error)}
      </div>
    );
  }

  return (
    <AmbiguityContent
      coefficientSets={coefficientSets}
      item={item}
      onResolved={onResolved}
      onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
      onSkip={onSkip}
      planItem={planItem}
      progress={progress}
      selectedCoefficientSetId={selectedCoefficientSetId}
    />
  );
}
