import type { FormEvent } from "react";
import { Calculator, Loader2, Pencil, Send } from "lucide-react";

import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import type {
  PricebookCalculateResponse,
  PricebookItemInputSpec,
  PricebookItemRowDetail
} from "../../pricebooks/pricebookApi";
import { Button } from "../../../shared/components/Button";
import { HelpHint } from "../../../shared/components/HelpHint";
import { InfoBox } from "../../../shared/components/InfoBox";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";
import { getCalculationMessages } from "../costReportUtils";

export function CalculationSection({
  addLineDisabledReason,
  canAddLine,
  calculation,
  calculationError,
  coefficientSets,
  inputErrors,
  inputs,
  inputValues,
  isCalculationLocked,
  isAddingLine,
  isCalculating,
  isRangeBased,
  lineError,
  lineSuccess,
  manualUnitPrice,
  manualUnitPriceError,
  matchedRangeRow,
  onAddLine,
  onCalculate,
  onEditCalculation,
  onInputValueChange,
  onSelectedCoefficientSetIdChange,
  quantity,
  quantityError,
  rangeMatchError,
  requiresManualPrice,
  requiresRowSelection,
  selectedCoefficientSetId,
  setManualUnitPrice,
  setQuantity
}: {
  addLineDisabledReason: string | null;
  canAddLine: boolean;
  calculation: PricebookCalculateResponse | null;
  calculationError: string | null;
  coefficientSets: ProjectCoefficientSet[];
  inputErrors?: Record<number, string | null>;
  inputs?: PricebookItemInputSpec[];
  inputValues?: Record<number, string>;
  isCalculationLocked: boolean;
  isAddingLine: boolean;
  isCalculating: boolean;
  isRangeBased?: boolean;
  lineError: string | null;
  lineSuccess: string | null;
  manualUnitPrice: string;
  manualUnitPriceError: string | null;
  matchedRangeRow?: PricebookItemRowDetail | null;
  onAddLine: () => void;
  onCalculate: (event: FormEvent<HTMLFormElement>) => void;
  onEditCalculation: () => void;
  onInputValueChange?: (key: number, value: string) => void;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  quantity: string;
  quantityError: string | null;
  rangeMatchError?: string | null;
  requiresManualPrice: boolean;
  requiresRowSelection: boolean;
  selectedCoefficientSetId: number | null;
  setManualUnitPrice: (value: string) => void;
  setQuantity: (value: string) => void;
}) {
  const calculationMessages = getCalculationMessages(calculation?.calculation_output);
  const isMultiInput = Boolean(inputs && inputs.length > 0);

  const badgeTone = requiresManualPrice ? "amber" : requiresRowSelection ? "amber" : "emerald";
  const badgeLabel = requiresManualPrice
    ? "نیازمند قیمت ستاره‌دار"
    : requiresRowSelection
      ? "انتخاب ردیف لازم است"
      : isMultiInput
        ? "چند ورودی"
        : isRangeBased
          ? "مبتنی بر بازه"
          : "آماده محاسبه";

  // Block محاسبه when user has entered a valid value for a range item but it's out of all ranges
  const isCalculateDisabled = isCalculating || (Boolean(isRangeBased) && Boolean(rangeMatchError));

  const colCount = 1 + (requiresManualPrice ? 1 : 0) + 1;
  const gridCols =
    colCount === 3 ? "sm:grid-cols-[1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]";

  const submitButtons = isCalculationLocked ? (
    <div className="flex self-end gap-2">
      <Button onClick={onEditCalculation} type="button" variant="secondary">
        <Pencil className="h-4 w-4" />
        ویرایش
      </Button>
      <Button disabled={!canAddLine || isAddingLine} onClick={onAddLine} type="button">
        {isAddingLine ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        افزودن
      </Button>
    </div>
  ) : (
    <Button className="self-end" disabled={isCalculateDisabled} type="submit">
      {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
      محاسبه
    </Button>
  );

  const coefficientField = (
    <label className="space-y-2">
      <span className="flex items-center gap-1 text-sm font-bold text-slate-200 light:text-slate-700">
        ضریب
        {coefficientSets.length === 0 ? (
          <HelpHint text="برای محاسبه با ضریب، ابتدا در بخش ضرایب پروژه مجموعه بسازید." />
        ) : null}
      </span>
      <select
        className={inputClasses}
        disabled={isCalculationLocked}
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
  );

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 light:bg-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-black text-white light:text-slate-950">
          <Calculator className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
          محاسبه آیتم
          <HelpHint text="مقدار برای محاسبه رسمی ارسال می‌شود و مبالغ فقط از پاسخ محاسبه نمایش داده می‌شوند." />
        </h3>
        <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
      </div>

      {requiresManualPrice ? (
        <p className="mt-3 text-sm leading-7 text-amber-100 light:text-amber-800">
          این آیتم قیمت رسمی ندارد؛ قیمت واحد را خودتان وارد کنید.
        </p>
      ) : null}

      {/* Multi-input form path */}
      {isMultiInput ? (
        <form className="mt-4 space-y-3" onSubmit={onCalculate}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(inputs ?? []).map((input) => (
              <label className="space-y-2" key={input.value_key}>
                <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                  {input.label_fa}
                  {input.unit ? (
                    <span className="mr-1 font-normal text-slate-400 light:text-slate-500">
                      ({input.unit})
                    </span>
                  ) : null}
                </span>
                <input
                  className={classNames(inputClasses, "text-left")}
                  dir="ltr"
                  disabled={isCalculationLocked}
                  inputMode="decimal"
                  onChange={(event) =>
                    onInputValueChange?.(input.value_key, event.target.value)
                  }
                  placeholder={input.min_value ?? "0"}
                  value={inputValues?.[input.value_key] ?? ""}
                />
                {inputErrors?.[input.value_key] ? (
                  <p className="text-xs text-rose-300 light:text-rose-700">
                    {inputErrors[input.value_key]}
                  </p>
                ) : null}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            {coefficientField}
            {submitButtons}
          </div>
        </form>
      ) : (
        /* Single-quantity / range-based / v1 form path */
        <form className={classNames("mt-4 grid gap-3", gridCols)} onSubmit={onCalculate}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">مقدار</span>
            <input
              className={classNames(inputClasses, "text-left")}
              dir="ltr"
              disabled={isCalculationLocked}
              inputMode="decimal"
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="1"
              value={quantity}
            />
          </label>
          {requiresManualPrice ? (
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                قیمت واحد (ریال)
              </span>
              <input
                className={classNames(inputClasses, "text-left")}
                dir="ltr"
                disabled={isCalculationLocked}
                inputMode="decimal"
                onChange={(event) => setManualUnitPrice(event.target.value)}
                placeholder="0"
                value={manualUnitPrice}
              />
            </label>
          ) : null}
          {coefficientField}
          {submitButtons}
        </form>
      )}

      {/* Range-based: matched row read-only display — switches to combined view after multi-row calculation */}
      {isRangeBased && matchedRangeRow ? (
        calculation && (calculation.rows_breakdown?.length ?? 0) > 1 ? (
          <div className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-400/8 px-3 py-2.5 text-sm light:border-emerald-300/40 light:bg-emerald-50">
            <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">
              ردیف‌های انتخاب‌شده
            </p>
            <div className="space-y-1">
              {(calculation.rows_breakdown ?? []).map((row) => (
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-0.5"
                  key={row.row_id}
                >
                  <span className="font-mono text-emerald-200 light:text-emerald-700">
                    {row.row_code}
                  </span>
                  <span className="flex-1 text-slate-100 light:text-slate-900">
                    {row.description_fa || row.title_fa}
                  </span>
                  <span className="text-slate-400 light:text-slate-500">
                    {formatDecimal(row.quantity)} {row.unit}
                  </span>
                  <span className="font-bold text-slate-200 light:text-slate-700">
                    {formatMoneyAmount(row.total)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-x-3 border-t border-white/10 pt-1.5 light:border-slate-200">
              <span className="flex-1 text-xs font-bold text-slate-300 light:text-slate-600">جمع</span>
              <span className="font-bold text-slate-200 light:text-slate-700">
                {formatMoneyAmount(calculation.base_amount)}
              </span>
            </div>
          </div>
        ) : (
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
        )
      ) : null}

      {quantityError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {quantityError}
        </p>
      ) : null}

      {rangeMatchError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {rangeMatchError}
        </p>
      ) : null}

      {manualUnitPriceError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {manualUnitPriceError}
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
            <InfoBox label="مقدار" value={`${formatDecimal(calculation.quantity)} ${calculation.unit}`} />
            <InfoBox
              label="قیمت دستی"
              value={calculation.requires_manual_unit_price ? "بله" : "خیر"}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox label="مبلغ پایه" value={formatMoneyAmount(calculation.base_amount)} />
            <InfoBox label="مبلغ ضرایب" value={formatMoneyAmount(calculation.coefficient_amount)} />
            <div className="rounded-lg border border-success-300/30 bg-success-400/10 p-3 light:border-success-300/40 light:bg-success-50">
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">مبلغ کل</p>
              <p className="mt-1 text-base font-black text-success-300 light:text-success-700">
                {formatMoneyAmount(calculation.total_amount)}
              </p>
            </div>
          </div>
          {(calculation.rows_breakdown?.length ?? 0) > 1 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="mb-2 text-xs font-bold text-slate-400 light:text-slate-500">
                تجزیه ردیف‌ها
              </p>
              <div className="space-y-1">
                {(calculation.rows_breakdown ?? []).map((row) => (
                  <div
                    className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm"
                    key={row.row_id}
                  >
                    <span className="font-mono text-emerald-200 light:text-emerald-700">
                      {row.row_code}
                    </span>
                    <span className="flex-1 text-slate-300 light:text-slate-700">
                      {row.description_fa || row.title_fa}
                    </span>
                    <span className="text-slate-400 light:text-slate-500">
                      {formatDecimal(row.quantity)} {row.unit}
                    </span>
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
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">ضرایب اعمال‌شده</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(calculation.applied_coefficients ?? []).map((coefficient) => (
                  <span
                    className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100 light:text-violet-800"
                    key={`${coefficient.coefficient_key}-${coefficient.scope}-${coefficient.coefficient_value_id}`}
                  >
                    {coefficient.label_fa}: {coefficient.multiplier}، اثر{" "}
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
          {addLineDisabledReason && isCalculationLocked ? (
            <p className="text-xs leading-6 text-amber-100 light:text-amber-800">
              {addLineDisabledReason}
            </p>
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
