import { Calculator, Loader2 } from "lucide-react";

import type {
  PricebookCalculateResponse,
  PricebookItemDetail,
  PricebookItemInputSpec,
  PricebookItemRowDetail
} from "../../pricebooks/pricebookApi";
import { HelpHint } from "../../../shared/components/HelpHint";
import { InfoBox } from "../../../shared/components/InfoBox";
import { StatusBadge } from "../../../shared/components/StatusBadge";
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

export function CalculationSection({
  calculation,
  calculationError,
  calculationStatusLabel,
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
  quantity,
  quantityError,
  rangeMatchError,
  requiresManualPrice,
  requiresRowSelection,
  rowSelection,
  setManualUnitPrice,
  setQuantity,
  unit
}: {
  calculation: PricebookCalculateResponse | null;
  calculationError: string | null;
  calculationStatusLabel: string;
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
  quantity: string;
  quantityError: string | null;
  rangeMatchError?: string | null;
  requiresManualPrice: boolean;
  requiresRowSelection: boolean;
  rowSelection?: CalculationRowSelection;
  setManualUnitPrice: (value: string) => void;
  setQuantity: (value: string) => void;
  unit?: string;
}) {
  const calculationMessages = getCalculationMessages(calculation?.calculation_output);
  const calculationRows = calculation
    ? getVisibleCalculationRows(calculation, itemRows, customPriceRowCodes)
    : [];
  const isMultiInput = Boolean(inputs && inputs.length > 0);
  const inputsDisabled = isAddingLine;

  const badgeTone = requiresManualPrice ? "amber" : requiresRowSelection ? "amber" : "emerald";
  const badgeLabel = requiresManualPrice
    ? "نیازمند قیمت ستاره‌دار"
    : requiresRowSelection
      ? "انتخاب ردیف لازم است"
      : isMultiInput
        ? "چند ورودی"
        : isRangeBased
          ? "مبتنی بر بازه"
          : "محاسبه خودکار";

  const gridCols = requiresManualPrice ? "sm:grid-cols-2" : "sm:grid-cols-1";

  const rowSelectionField = rowSelection ? (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-200 light:text-slate-700">
        {rowSelection.label}
      </span>
      <select
        className={inputClasses}
        disabled={inputsDisabled}
        onChange={(event) =>
          rowSelection.onChange(event.target.value ? Number(event.target.value) : null)
        }
        value={rowSelection.value ?? ""}
      >
        <option value="">{rowSelection.placeholder}</option>
        {rowSelection.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {rowSelection.error ? (
        <p className="text-xs text-rose-300 light:text-rose-700">{rowSelection.error}</p>
      ) : null}
      {rowSelection.options.length === 0 ? (
        <p className="text-xs leading-6 text-amber-100 light:text-amber-800">
          گزینه‌ای برای انتخاب از سمت فهرست‌بها دریافت نشده است.
        </p>
      ) : null}
    </label>
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
                : input.unit || "عدد مثبت"
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
        {row.isCustomPrice ? "دستی" : "رسمی"}
      </span>
    );
  }

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 light:bg-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-black text-white light:text-slate-950">
          <Calculator className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
          محاسبه آیتم
          <HelpHint text="ورودی‌ها با تأخیر کوتاه برای محاسبه رسمی به بک‌اند ارسال می‌شوند و مبالغ فقط از پاسخ بک‌اند نمایش داده می‌شوند." />
        </h3>
        <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 py-2 text-sm text-slate-300 light:border-slate-200 light:bg-white light:text-slate-600">
        {isCalculating ? <Loader2 className="h-4 w-4 animate-spin text-emerald-300" /> : null}
        <span>{calculationStatusLabel}</span>
      </div>

      {requiresManualPrice ? (
        <p className="mt-3 text-sm leading-7 text-amber-100 light:text-amber-800">
          این آیتم قیمت رسمی ندارد؛ قیمت واحد را وارد کنید تا بک‌اند با همان قیمت محاسبه کند.
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

      {calculationError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {calculationError}
        </p>
      ) : null}

      {calculation ? (
        <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-200 light:bg-white">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">
            نتیجه محاسبه
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <InfoBox label="کد ردیف" value={calculation.row_code} />
            <InfoBox label="بهای واحد" value={formatMoneyAmount(calculation.unit_price)} />
            <InfoBox
              label="مقدار"
              value={`${formatDecimal(calculation.quantity)} ${calculation.unit}`}
            />
            <InfoBox
              label="قیمت دستی"
              value={calculation.requires_manual_unit_price ? "بله" : "خیر"}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox label="مبلغ پایه" value={formatMoneyAmount(calculation.base_amount)} />
            <InfoBox label="مبلغ ضرایب" value={formatMoneyAmount(calculation.coefficient_amount)} />
            <div className="rounded-lg border border-success-300/30 bg-success-400/10 p-3 light:border-success-300/40 light:bg-success-50">
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">
                جمع کل محاسبه
              </p>
              <p className="mt-1 text-base font-black text-success-300 light:text-success-700">
                {formatMoneyAmount(calculation.total_amount)}
              </p>
            </div>
          </div>
          {calculationRows.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="mb-2 text-xs font-bold text-slate-400 light:text-slate-500">
                تجزیه ردیف‌های محاسبه
              </p>
              <div className="hidden grid-cols-[7rem_1fr_7rem_8rem_5rem_8rem] gap-3 border-b border-white/10 pb-2 text-xs font-bold text-slate-400 light:border-slate-200 light:text-slate-500 md:grid">
                <span>شماره ردیف</span>
                <span>شرح ردیف</span>
                <span>مقدار</span>
                <span>بهای واحد</span>
                <span>منبع</span>
                <span>مبلغ ردیف</span>
              </div>
              <div className="mt-2 space-y-2">
                {calculationRows.map((row, index) => (
                  <div
                    className="grid gap-2 rounded-lg border border-white/10 bg-slate-950/20 p-3 text-sm light:border-slate-200 light:bg-white md:grid-cols-[7rem_1fr_7rem_8rem_5rem_8rem] md:border-0 md:bg-transparent md:p-0"
                    key={`${row.rowId ?? row.rowCode ?? "row"}-${index}`}
                  >
                    <span className="font-mono font-bold text-emerald-200 light:text-emerald-700">
                      {row.rowCode ?? "-"}
                    </span>
                    <span className="text-slate-300 light:text-slate-700">{row.title}</span>
                    <span className="text-slate-400 light:text-slate-500">
                      {formatDecimal(row.quantity)} {row.unit ?? ""}
                    </span>
                    <span className="text-slate-300 light:text-slate-700">
                      {formatMoneyAmount(row.unitPrice)}
                    </span>
                    {renderPriceSourceBadge(row)}
                    <span className="font-bold text-slate-200 light:text-slate-800">
                      {formatMoneyAmount(row.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {calculation.calculate_message ? (
            <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
              {calculation.calculate_message}
            </p>
          ) : null}
          {(calculation.applied_coefficients?.length ?? 0) > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">
                ضرایب اعمال‌شده
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(calculation.applied_coefficients ?? []).map((coefficient) => (
                  <span
                    className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100 light:text-violet-800"
                    key={`${coefficient.coefficient_key}-${coefficient.scope}-${coefficient.coefficient_value_id}`}
                  >
                    {coefficient.label_fa || coefficient.coefficient_key}:{" "}
                    {coefficient.multiplier} | {getCoefficientScopeLabel(coefficient.scope)} | اثر{" "}
                    {formatMoneyAmount(coefficient.effect_amount)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {calculationMessages.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">
                پیام‌های محاسبه
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-7 text-slate-300 light:text-slate-700">
                {calculationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
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
