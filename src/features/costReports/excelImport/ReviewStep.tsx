import { Loader2 } from "lucide-react";

import type { ReviewLine } from "./wizardTypes";
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";

export function ReviewStep({
  lines,
  isSubmitting,
  submitError,
  lineErrors,
  onQuantityChange,
  onManualPriceChange,
  onSubmit
}: {
  lines: ReviewLine[];
  isSubmitting: boolean;
  submitError: string | null;
  lineErrors: Record<number, string>;
  onQuantityChange: (planItemIdx: number, value: string) => void;
  onManualPriceChange: (planItemIdx: number, value: string) => void;
  onSubmit: () => void;
}) {
  const totalLines = lines.length;
  const uniqueItems = new Set(lines.map((l) => l.pricebook_item_id)).size;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-white light:text-slate-950">بازبینی ردیف‌ها</h3>
        <p className="mt-1 text-sm text-slate-400 light:text-slate-500">
          {totalLines} ردیف، {uniqueItems} آیتم یکتا
        </p>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {lines.map((line, idx) => {
          const err = lineErrors[line.planItemIdx];
          return (
            <div
              className={[
                "rounded-lg border p-3 light:bg-slate-50",
                err
                  ? "border-rose-400/40 bg-rose-400/8 light:border-rose-300 light:bg-rose-50"
                  : "border-white/10 bg-white/7 light:border-slate-200"
              ].join(" ")}
              key={idx}
            >
              <p
                className="truncate text-sm font-bold text-slate-100 light:text-slate-900"
                title={cleanDisplayText(line.description_fa, "آیتم")}
              >
                {cleanDisplayText(line.description_fa, "آیتم")}
              </p>
              <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
                {line.unit_fa ? `واحد: ${line.unit_fa}` : null}
                {line.isResolved ? (
                  <span className="mr-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-200 light:text-violet-700">
                    محاسبه‌شده
                  </span>
                ) : null}
              </p>
              {line.isResolved ? (
                <div className="mt-2 text-sm text-slate-300 light:text-slate-600">
                  <span>مقدار: {formatDecimal(line.quantity)}</span>
                  {line.manual_unit_price ? (
                    <span className="mr-3">قیمت واحد: {formatMoneyAmount(line.manual_unit_price)}</span>
                  ) : null}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-3">
                  {line.manual_unit_price !== "" ? (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 light:text-slate-500">مقدار</span>
                      <input
                        className={inputClasses + " h-9 w-28 text-sm"}
                        dir="ltr"
                        onChange={(e) => onQuantityChange(line.planItemIdx, e.target.value)}
                        type="text"
                        value={line.quantity}
                      />
                    </label>
                  ) : (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 light:text-slate-500">مقدار</span>
                      <input
                        className={inputClasses + " h-9 w-28 text-sm"}
                        dir="ltr"
                        onChange={(e) => onQuantityChange(line.planItemIdx, e.target.value)}
                        type="text"
                        value={line.quantity}
                      />
                    </label>
                  )}
                  {line.manual_unit_price !== "" ? (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 light:text-slate-500">قیمت واحد</span>
                      <input
                        className={inputClasses + " h-9 w-36 text-sm"}
                        dir="ltr"
                        onChange={(e) => onManualPriceChange(line.planItemIdx, e.target.value)}
                        type="text"
                        value={line.manual_unit_price}
                      />
                    </label>
                  ) : null}
                </div>
              )}
              {err ? (
                <p className="mt-2 text-xs text-rose-300 light:text-rose-600">{err}</p>
              ) : null}
            </div>
          );
        })}
        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400 light:text-slate-500">
            هیچ ردیفی برای افزودن وجود ندارد.
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 light:border-rose-300 light:bg-rose-50 light:text-rose-700">
          {submitError}
        </p>
      ) : null}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-base font-bold text-white shadow transition hover:bg-emerald-400 disabled:opacity-50 light:bg-emerald-600 light:hover:bg-emerald-500"
        disabled={isSubmitting || lines.length === 0}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        افزودن {totalLines} ردیف به صورت‌بها
      </button>
    </div>
  );
}
