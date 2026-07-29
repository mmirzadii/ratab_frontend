import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import type {
  PricebookCalculateResponse,
  PricebookItemDetail,
  PricebookItemInputSpec,
  PricebookItemRowDetail
} from "../../pricebooks/pricebookApi";
import { classNames } from "../../../shared/utils/classNames";
import { formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";
import {
  formatInputLabel,
  getCalculationMessages,
  getCoefficientScopeLabel,
  getInputStateKey,
  getSelectInputOptions,
  getVisibleCalculationRows,
  hasPositiveMoneyValue,
  isMainNumericInput,
  isSelectInput
} from "../costReportUtils";

export type CalculationRowSelectionOption = {
  id: number;
  label: string;
  helper?: string;
};

export type CalculationRowSelection = {
  error?: string | null;
  label: string;
  onChange: (rowId: number | null) => void;
  options: CalculationRowSelectionOption[];
  placeholder: string;
  value: number | null;
};

export type CalculationCustomFallbackPrice = {
  error?: string | null;
  officialUnitPrice?: string | null;
  onChange: (value: string) => void;
  rowCode: string;
  title: string;
  unit?: string | null;
  value: string;
};

export type CalculationStatusDotState = "green" | "yellow" | "red";

function ResponsiveRowSelect({
  disabled,
  selection
}: {
  disabled: boolean;
  selection: CalculationRowSelection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = selection.options.find((option) => option.id === selection.value);

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative min-w-0" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={classNames(
          inputClasses,
          "flex min-h-11 h-auto w-full min-w-0 items-center justify-between gap-2 py-2 text-right"
        )}
        disabled={disabled || selection.options.length === 0}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={classNames("min-w-0 flex-1 break-words", !selectedOption && "text-slate-400")}>
          {selectedOption?.label ?? selection.placeholder}
        </span>
        <ChevronDown
          className={classNames("h-4 w-4 shrink-0 transition", isOpen && "rotate-180")}
        />
      </button>

      {isOpen ? (
        <div
          aria-label={selection.label}
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-[min(45dvh,18rem)] min-w-0 overflow-y-auto overscroll-contain rounded-lg border border-white/15 bg-slate-900 p-1 shadow-2xl [scrollbar-width:thin] light:border-slate-200 light:bg-white"
          role="listbox"
        >
          {selection.options.map((option) => {
            const isSelected = option.id === selection.value;
            return (
              <button
                aria-selected={isSelected}
                className={classNames(
                  "flex w-full min-w-0 items-start gap-2 rounded-md px-3 py-2.5 text-right text-sm leading-6 transition",
                  isSelected
                    ? "bg-emerald-400/15 text-emerald-100 light:bg-emerald-50 light:text-emerald-800"
                    : "text-slate-200 hover:bg-white/8 light:text-slate-800 light:hover:bg-slate-100"
                )}
                key={option.id}
                onClick={() => {
                  selection.onChange(option.id);
                  setIsOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="min-w-0 flex-1 whitespace-normal break-words">{option.label}</span>
                {isSelected ? <Check className="mt-1 h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CalculationSection({
  calculation,
  calculationError,
  calculationStatusDot,
  customFallbackPrice,
  customPriceRowCodes,
  inputErrors,
  inputs,
  inputValues,
  isAddingLine,
  isCalculating,
  isRangeBased,
  item,
  itemRows,
  lineError,
  lineSuccess,
  manualUnitPrice,
  manualUnitPriceError,
  matchedRangeRow,
  onAddLine,
  onInputValueChange,
  onRowsClick,
  quantity,
  quantityError,
  rangeMatchError,
  requiresManualPrice,
  requiresRowPrice,
  rowSelection,
  setManualUnitPrice,
  setQuantity,
  unit
}: {
  calculation: PricebookCalculateResponse | null;
  calculationError: string | null;
  calculationStatusDot: CalculationStatusDotState;
  customFallbackPrice?: CalculationCustomFallbackPrice;
  customPriceRowCodes?: string[];
  inputErrors?: Record<string, string | null>;
  inputs?: PricebookItemInputSpec[];
  inputValues?: Record<string, string>;
  isAddingLine: boolean;
  isCalculating: boolean;
  isRangeBased?: boolean;
  item?: PricebookItemDetail;
  itemRows?: PricebookItemRowDetail[];
  lineError: string | null;
  lineSuccess: string | null;
  manualUnitPrice: string;
  manualUnitPriceError: string | null;
  matchedRangeRow?: PricebookItemRowDetail | null;
  onAddLine: () => void;
  onInputValueChange?: (key: string, value: string) => void;
  onRowsClick?: () => void;
  quantity: string;
  quantityError: string | null;
  rangeMatchError?: string | null;
  requiresManualPrice: boolean;
  requiresRowPrice?: boolean;
  requiresRowSelection: boolean;
  rowSelection?: CalculationRowSelection;
  setManualUnitPrice: (value: string) => void;
  setQuantity: (value: string) => void;
  unit?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const calculationMessages = getCalculationMessages(calculation?.calculation_output);
  const calculationRows = calculation
    ? getVisibleCalculationRows(calculation, itemRows, customPriceRowCodes)
    : [];
  const isMultiInput = Boolean(inputs && inputs.length > 0);
  const inputsDisabled = isAddingLine;

  const dotTitle =
    calculationStatusDot === "green"
      ? "محاسبه به‌روز است"
      : calculationStatusDot === "red"
        ? "خطا در افزودن آیتم"
        : "محاسبه در انتظار تکمیل یا به‌روزرسانی است";
  const dotClasses = classNames(
    "block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-slate-950 light:ring-offset-white",
    calculationStatusDot === "green"
      ? "bg-emerald-300 ring-emerald-300/25"
      : calculationStatusDot === "red"
        ? "bg-rose-400 ring-rose-300/25"
        : "bg-amber-300 ring-amber-300/25",
    calculationStatusDot === "yellow" && isCalculating ? "animate-pulse" : ""
  );
  const calculationPriceLabel =
    calculation?.requires_manual_unit_price || calculationRows.some((row) => row.isCustomPrice)
      ? "★ ستاره‌دار"
      : "قیمت رسمی";
  const hasInlineValidationError = Boolean(
    quantityError ||
      manualUnitPriceError ||
      rowSelection?.error ||
      customFallbackPrice?.error ||
      rangeMatchError ||
      Object.values(inputErrors ?? {}).some(Boolean)
  );
  const visibleCalculationError =
    calculationError && !hasInlineValidationError ? calculationError : null;

  const gridCols = requiresManualPrice ? "sm:grid-cols-2" : "sm:grid-cols-1";

  const rowSelectionField = rowSelection ? (
    <div className="space-y-2">
      <span className="text-sm font-bold text-slate-200 light:text-slate-700">
        {rowSelection.label}
      </span>
      <ResponsiveRowSelect disabled={inputsDisabled} selection={rowSelection} />
      {rowSelection.error ? (
        <p className="text-xs text-rose-300 light:text-rose-700">{rowSelection.error}</p>
      ) : null}
      {rowSelection.options.length === 0 ? (
        <p className="text-xs leading-6 text-amber-100 light:text-amber-800">
          گزینه‌ای برای انتخاب از سمت فهرست‌بها دریافت نشده است.
        </p>
      ) : null}
    </div>
  ) : null;

  const manualPriceField = requiresManualPrice ? (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-200 light:text-slate-700">
        {formatInputLabel("قیمت واحد", "ریال")}
      </span>
      <input
        className={classNames(inputClasses, "text-left")}
        dir="ltr"
        disabled={inputsDisabled}
        inputMode="decimal"
        onChange={(event) => setManualUnitPrice(event.target.value)}
        placeholder="ریال"
        value={manualUnitPrice}
      />
      {manualUnitPriceError ? (
        <p className="text-xs text-rose-300 light:text-rose-700">{manualUnitPriceError}</p>
      ) : null}
    </label>
  ) : null;

  const customFallbackPriceField = customFallbackPrice ? (
    <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 light:border-amber-300/50 light:bg-amber-50">
      <p className="text-sm leading-7 text-amber-100 light:text-amber-800">
        این مقدار خارج از بازه‌های فهرست‌بهاست. بهای واحد سفارشی برای ردیف اصلی وارد کنید.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-[7rem_1fr_6rem_12rem] md:items-end">
        <div>
          <p className="text-xs font-bold text-slate-400 light:text-slate-500">ردیف اصلی</p>
          <p className="mt-1 font-mono font-bold text-emerald-200 light:text-emerald-700">
            {customFallbackPrice.rowCode}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 light:text-slate-500">شرح ردیف</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-100 light:text-slate-900">
            {customFallbackPrice.title}
          </p>
          <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
            قیمت رسمی: {formatMoneyAmount(customFallbackPrice.officialUnitPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 light:text-slate-500">واحد</p>
          <p className="mt-1 text-sm text-slate-300 light:text-slate-700">
            {customFallbackPrice.unit ?? "-"}
          </p>
        </div>
        <label className="space-y-1">
          <span className="text-xs font-bold text-slate-200 light:text-slate-700">
            بهای واحد سفارشی
          </span>
          <input
            className="h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-left text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 light:border-slate-200 light:bg-white light:text-slate-950"
            dir="ltr"
            disabled={inputsDisabled}
            inputMode="decimal"
            onChange={(event) => customFallbackPrice.onChange(event.target.value)}
            placeholder="بهای واحد"
            value={customFallbackPrice.value}
          />
          <p className="text-xs text-slate-400 light:text-slate-500">
            برای ردیف اصلی {customFallbackPrice.rowCode} استفاده می‌شود.
          </p>
          {customFallbackPrice.error ? (
            <p className="text-xs text-rose-300 light:text-rose-700">
              {customFallbackPrice.error}
            </p>
          ) : null}
        </label>
      </div>
    </div>
  ) : null;

  function renderInputField(input: PricebookItemInputSpec) {
    const inputKey = getInputStateKey(input);
    const selectInput = isSelectInput(input);
    const selectOptions = selectInput ? getSelectInputOptions(input, item) : [];
    const selectedOption = selectOptions.find(
      (option) => option.value === (inputValues?.[inputKey] ?? "")
    );
    const usesRowFallback =
      selectInput &&
      selectOptions.length > 0 &&
      selectOptions.every((option) => option.source === "rows");

    return (
      <label className="space-y-2" key={inputKey}>
        <span className="text-sm font-bold text-slate-200 light:text-slate-700">
          {formatInputLabel(input.label_fa, input.unit, selectInput)}
        </span>
        {selectInput ? (
          <>
            <select
              className={inputClasses}
              disabled={inputsDisabled || selectOptions.length === 0}
              onChange={(event) => onInputValueChange?.(inputKey, event.target.value)}
              value={inputValues?.[inputKey] ?? ""}
            >
              <option value="">انتخاب کنید</option>
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedOption?.helper ? (
              <p className="text-xs leading-6 text-slate-400 light:text-slate-500">
                {selectedOption.helper}
              </p>
            ) : null}
            {selectOptions.length === 0 ? (
              <p className="text-xs leading-6 text-amber-100 light:text-amber-800">
                گزینه‌ای برای انتخاب این ردیف وجود ندارد.
              </p>
            ) : null}
            {usesRowFallback ? (
              <p className="text-xs leading-6 text-slate-400 light:text-slate-500">
                برچسب‌های کوتاه انتخاب از API دریافت نشده‌اند؛ عنوان ردیف‌ها موقتاً نمایش داده می‌شود.
              </p>
            ) : null}
          </>
        ) : (
          <input
            className={classNames(inputClasses, "text-left")}
            dir="ltr"
            disabled={inputsDisabled}
            inputMode="decimal"
            onChange={(event) => onInputValueChange?.(inputKey, event.target.value)}
            placeholder={
              input.min_value && Number(input.min_value) > 0
                ? input.min_value
                : input.unit || (isMainNumericInput(input) ? "عدد مثبت" : "عدد صفر یا بیشتر")
            }
            value={inputValues?.[inputKey] ?? ""}
          />
        )}
        {inputErrors?.[inputKey] ? (
          <p className="text-xs text-rose-300 light:text-rose-700">
            {inputErrors[inputKey]}
          </p>
        ) : null}
      </label>
    );
  }

  function renderPriceSourceBadge(row: (typeof calculationRows)[number]) {
    return (
      <span
        className={classNames(
          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-bold",
          row.isCustomPrice
            ? "border-amber-300/35 bg-amber-400/15 text-amber-100 light:text-amber-800"
            : "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 light:text-emerald-800"
        )}
        title={row.priceSource ?? undefined}
      >
        {row.isCustomPrice ? "★ ستاره‌دار" : "قیمت رسمی"}
      </span>
    );
  }

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 light:bg-emerald-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          aria-label={dotTitle}
          className={dotClasses}
          role="status"
          title={dotTitle}
        />
      </div>

      {requiresManualPrice || requiresRowPrice ? (
        <p className="mt-3 text-sm leading-7 text-amber-100 light:text-amber-800">
          {requiresRowPrice
            ? "این آیتم قیمت رسمی ندارد؛ قیمت را فقط از بخش ردیف‌های فهرست‌بها و با دکمه مداد وارد کنید."
            : "این آیتم قیمت رسمی ندارد؛ قیمت واحد را وارد کنید تا محاسبه انجام شود."}
        </p>
      ) : null}

      {customFallbackPriceField}

      {isMultiInput ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onAddLine();
          }}
        >
          {rowSelectionField}
          <div className="grid gap-3 sm:grid-cols-2">
            {(inputs ?? []).map((input) => renderInputField(input))}
            {manualPriceField}
          </div>
        </form>
      ) : (
        <form
          className={classNames("mt-4 grid gap-3", gridCols)}
          onSubmit={(event) => {
            event.preventDefault();
            onAddLine();
          }}
        >
          {rowSelectionField ? <div className="sm:col-span-full">{rowSelectionField}</div> : null}
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">
              {formatInputLabel("مقدار", unit)}
            </span>
            <input
              className={classNames(inputClasses, "text-left")}
              dir="ltr"
              disabled={inputsDisabled}
              inputMode="decimal"
              onChange={(event) => setQuantity(event.target.value)}
              placeholder={unit || "عدد مثبت"}
              value={quantity}
            />
            {quantityError ? (
              <p className="text-xs text-rose-300 light:text-rose-700">{quantityError}</p>
            ) : null}
          </label>
          {manualPriceField}
        </form>
      )}

      {isRangeBased && matchedRangeRow ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-300/25 bg-emerald-400/8 px-3 py-2.5 text-sm light:border-emerald-300/40 light:bg-emerald-50">
          <span className="text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">
            ردیف انتخاب‌شده
          </span>
          <span className="font-mono text-emerald-200 light:text-emerald-700">
            {matchedRangeRow.row_code}
          </span>
          <span className="flex-1 text-slate-100 light:text-slate-900">
            {matchedRangeRow.title_fa || matchedRangeRow.short_title_fa}
          </span>
          <span className="text-slate-400 light:text-slate-500">{matchedRangeRow.unit}</span>
          {matchedRangeRow.unit_price ? (
            <span className="font-bold text-slate-200 light:text-slate-700">
              {formatMoneyAmount(matchedRangeRow.unit_price)}
            </span>
          ) : null}
        </div>
      ) : null}

      {rangeMatchError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {rangeMatchError}
        </p>
      ) : null}

      {visibleCalculationError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {visibleCalculationError}
        </p>
      ) : null}

      {calculation ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/30 p-3 light:border-slate-200 light:bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">
                جمع کل
              </p>
              <p className="mt-1 text-xl font-black text-success-300 light:text-success-700">
                {formatMoneyAmount(calculation.total_amount)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onRowsClick ? (
                <button
                  className="rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-50"
                  onClick={onRowsClick}
                  type="button"
                >
                  ردیف‌ها
                </button>
              ) : null}
              <button
                className="rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-50"
                onClick={() => setShowDetails((current) => !current)}
                type="button"
              >
                {showDetails ? "بستن جزئیات" : "جزئیات"}
              </button>
            </div>
          </div>

          {showDetails ? (
            <div className="mt-3 space-y-3 border-t border-white/10 pt-3 light:border-slate-200">
              <dl className="grid gap-x-4 gap-y-2 text-xs leading-6 text-slate-300 light:text-slate-700 sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400 light:text-slate-500">کد ردیف اصلی</dt>
                  <dd className="font-mono font-bold text-slate-100 light:text-slate-900">
                    {calculation.row_code}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400 light:text-slate-500">مقدار</dt>
                  <dd className="font-bold">
                    {formatDecimal(calculation.quantity)} {calculation.unit}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400 light:text-slate-500">بهای واحد</dt>
                  <dd className="font-bold">
                    {hasPositiveMoneyValue(calculation.unit_price)
                      ? formatMoneyAmount(calculation.unit_price)
                      : "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400 light:text-slate-500">قیمت</dt>
                  <dd className="font-bold">{calculationPriceLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400 light:text-slate-500">مبلغ پایه</dt>
                  <dd className="font-bold">{formatMoneyAmount(calculation.base_amount)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400 light:text-slate-500">مبلغ ضرایب</dt>
                  <dd className="font-bold">
                    {formatMoneyAmount(calculation.coefficient_amount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 sm:col-span-2">
                  <dt className="text-slate-400 light:text-slate-500">جمع کل</dt>
                  <dd className="font-black text-success-300 light:text-success-700">
                    {formatMoneyAmount(calculation.total_amount)}
                  </dd>
                </div>
              </dl>

              {calculationRows.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-white/10 light:border-slate-200">
                  <table className="min-w-full text-right text-xs text-slate-300 light:text-slate-700">
                    <thead className="bg-white/7 text-slate-400 light:bg-slate-50 light:text-slate-500">
                      <tr>
                        <th className="px-2 py-2">ردیف</th>
                        <th className="px-2 py-2">مقدار</th>
                        <th className="px-2 py-2">بهای واحد</th>
                        <th className="px-2 py-2">مبلغ</th>
                        <th className="px-2 py-2">قیمت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculationRows.map((row, index) => (
                        <tr
                          className="border-t border-white/10 light:border-slate-200"
                          key={`${row.rowId ?? row.rowCode ?? "row"}-${index}`}
                        >
                          <td className="px-2 py-2 font-mono font-bold text-emerald-200 light:text-emerald-700">
                            {row.rowCode ?? "-"}
                          </td>
                          <td className="px-2 py-2">
                            {formatDecimal(row.quantity)} {row.unit ?? ""}
                          </td>
                          <td className="px-2 py-2">
                            {hasPositiveMoneyValue(row.unitPrice) ? formatMoneyAmount(row.unitPrice) : "-"}
                          </td>
                          <td className="px-2 py-2 font-bold">{formatMoneyAmount(row.total)}</td>
                          <td className="px-2 py-2">{renderPriceSourceBadge(row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {(calculation.applied_coefficients?.length ?? 0) > 0 ? (
                <div className="space-y-1 rounded-lg border border-white/10 bg-white/7 p-2 text-xs light:border-slate-200 light:bg-slate-50">
                  <p className="font-bold text-slate-400 light:text-slate-500">
                    ضرایب اعمال‌شده
                  </p>
                  {(calculation.applied_coefficients ?? []).map((coefficient) => (
                    <div
                      className="flex flex-wrap items-center gap-x-3 gap-y-1"
                      key={`${coefficient.coefficient_key}-${coefficient.scope}-${coefficient.coefficient_value_id}`}
                    >
                      <span className="font-bold text-violet-100 light:text-violet-800">
                        {coefficient.label_fa || coefficient.coefficient_key}
                      </span>
                      <span>{coefficient.multiplier}</span>
                      <span className="text-slate-400 light:text-slate-500">
                        {getCoefficientScopeLabel(coefficient.scope)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {calculation.calculate_message ? (
                <p className="text-xs leading-6 text-slate-300 light:text-slate-600">
                  {calculation.calculate_message}
                </p>
              ) : null}
              {calculationMessages.length > 0 ? (
                <ul className="space-y-1 text-xs leading-6 text-slate-300 light:text-slate-700">
                  {calculationMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {lineSuccess ? (
        <p className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm leading-7 text-emerald-100 light:text-emerald-800">
          {lineSuccess}
        </p>
      ) : null}

      {lineError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {lineError}
        </p>
      ) : null}
    </section>
  );
}
