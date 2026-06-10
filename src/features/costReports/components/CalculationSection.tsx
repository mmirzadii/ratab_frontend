import type { FormEvent } from "react";
import { AlertTriangle, Calculator, Loader2, Pencil, Send } from "lucide-react";

import type { PricebookCalculateResponse, PricebookItemDetail } from "../../pricebooks/pricebookApi";
import { Button } from "../../../shared/components/Button";
import { InfoBox } from "../../../shared/components/InfoBox";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";
import { getCalculationMessages } from "../costReportUtils";

export function CalculationSection({
  addLineDisabledReason,
  canAddLine,
  calculation,
  calculationError,
  isCalculationLocked,
  isAddingLine,
  isCalculating,
  lineError,
  lineSuccess,
  manualRows,
  manualUnitPrice,
  manualUnitPriceError,
  onAddLine,
  onCalculate,
  onEditCalculation,
  onManualUnitPriceChange,
  quantity,
  quantityError,
  requiresManualPrice,
  setQuantity
}: {
  addLineDisabledReason: string | null;
  canAddLine: boolean;
  calculation: PricebookCalculateResponse | null;
  calculationError: string | null;
  isCalculationLocked: boolean;
  isAddingLine: boolean;
  isCalculating: boolean;
  lineError: string | null;
  lineSuccess: string | null;
  manualRows: PricebookItemDetail["rows"];
  manualUnitPrice: string;
  manualUnitPriceError: string | null;
  onAddLine: () => void;
  onCalculate: (event: FormEvent<HTMLFormElement>) => void;
  onEditCalculation: () => void;
  onManualUnitPriceChange: (value: string) => void;
  quantity: string;
  quantityError: string | null;
  requiresManualPrice: boolean;
  setQuantity: (value: string) => void;
}) {
  const calculationMessages = getCalculationMessages(calculation?.calculation_output);

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 light:bg-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black text-white light:text-slate-950">
            <Calculator className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
            محاسبه آیتم
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            مقدار برای محاسبه رسمی ارسال می‌شود و مبالغ فقط از پاسخ محاسبه نمایش داده می‌شوند.
          </p>
        </div>
        <StatusBadge tone={requiresManualPrice ? "amber" : "emerald"}>
          {requiresManualPrice ? "نیازمند قیمت ستاره‌دار" : "آماده محاسبه"}
        </StatusBadge>
      </div>

      {requiresManualPrice ? (
        <div className="mt-4 space-y-3 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            <p>
              این آیتم قیمت رسمی کامل ندارد. متریل قیمت خالی را صفر فرض نمی‌کند. قیمت
              واحد پیشنهادی خود را وارد کنید. در نسخه v0.0 این قیمت به سرور ارسال نمی‌شود
              و محاسبه ستاره‌دار در نسخه‌های بعدی فعال می‌شود.
            </p>
          </div>
          {manualRows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {manualRows.map((row) => (
                <span
                  className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 font-mono text-xs"
                  key={row.id}
                >
                  {row.row_code}
                </span>
              ))}
            </div>
          ) : null}
          <label className="block space-y-2">
            <span className="text-xs font-bold">قیمت واحد پیشنهادی</span>
            <input
              className={inputClasses}
              dir="ltr"
              disabled={isCalculationLocked}
              inputMode="decimal"
              onChange={(event) => onManualUnitPriceChange(event.target.value)}
              placeholder="مثلاً 150000"
              value={manualUnitPrice}
            />
            {manualUnitPriceError ? (
              <p className="text-xs font-bold text-rose-300 light:text-rose-700">
                {manualUnitPriceError}
              </p>
            ) : null}
          </label>
        </div>
      ) : null}

      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={onCalculate}>
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
        <Button
          className="self-end"
          disabled={isCalculating || isCalculationLocked}
          type="submit"
        >
          {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          محاسبه
        </Button>
      </form>

      {quantityError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {quantityError}
        </p>
      ) : null}

      {calculationError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {calculationError}
        </p>
      ) : null}

      {calculation ? (
        <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-200 light:bg-white">
          <div className="grid gap-3 sm:grid-cols-4">
            <InfoBox label="کد ردیف" value={calculation.row_code} />
            <InfoBox label="بهای واحد" value={formatMoneyAmount(calculation.unit_price)} />
            <InfoBox label="مقدار" value={`${calculation.quantity} ${calculation.unit}`} />
            <InfoBox label="قیمت دستی" value={calculation.requires_manual_unit_price ? "بله" : "خیر"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox label="مبلغ پایه" value={formatMoneyAmount(calculation.base_amount)} />
            <InfoBox label="مبلغ ضرایب" value={formatMoneyAmount(calculation.coefficient_amount)} />
            <InfoBox label="مبلغ کل" value={formatMoneyAmount(calculation.total_amount)} />
          </div>
          {calculation.applied_coefficients.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">ضرایب اعمال‌شده</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {calculation.applied_coefficients.map((coefficient) => (
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
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">پیام‌های محاسبه</p>
              <ul className="mt-2 space-y-2 text-sm leading-7 text-slate-300 light:text-slate-700">
                {calculationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onEditCalculation} type="button" variant="secondary">
              <Pencil className="h-4 w-4" />
              ویرایش
            </Button>
            <Button disabled={!canAddLine || isAddingLine} onClick={onAddLine} type="button">
              {isAddingLine ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              افزودن به صورت‌بها
            </Button>
            {addLineDisabledReason ? (
              <p className="text-xs leading-6 text-amber-100 light:text-amber-800">
                {addLineDisabledReason}
              </p>
            ) : null}
          </div>
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
