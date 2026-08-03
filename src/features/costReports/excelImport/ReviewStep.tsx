import { Loader2 } from "lucide-react";

import type { ExcelPlanItem, FinancialDocumentLineCreateRequest } from "../../financialDocuments/financialDocumentApi";
import { GlassCard } from "../../../shared/components/GlassCard";
import { classNames } from "../../../shared/utils/classNames";
import { inputClasses } from "../constants";

export type ReviewLine = {
  planItem: ExcelPlanItem;
  payload: FinancialDocumentLineCreateRequest;
  error: string | null;
};

export function ReviewStep({
  isSubmitting,
  lines,
  onLinesChange,
  onSubmit,
  submitClassName,
  submitError
}: {
  isSubmitting: boolean;
  lines: ReviewLine[];
  onLinesChange: (lines: ReviewLine[]) => void;
  onSubmit: () => void;
  submitClassName?: string;
  submitError: string | null;
}) {
  function updateQuantity(index: number, qty: string) {
    onLinesChange(
      lines.map((line, i) =>
        i === index
          ? { ...line, payload: { ...line.payload, quantity: qty }, error: null }
          : line
      )
    );
  }

  const hasAnyError = lines.some((l) => l.error !== null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-ui-text-primary">
          بررسی ردیف‌ها ({lines.length} ردیف)
        </h3>
        <p className="mt-1 text-sm leading-7 text-ui-text-secondary">
          مقادیر را بررسی کنید و سپس به صورت‌بها اضافه کنید.
        </p>
      </div>

      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {lines.map((line, index) => (
          <GlassCard className="p-3" key={index}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ui-text-primary">
                  {line.planItem.description_fa || "آیتم"}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-ui-text-muted">
                  {line.planItem.row_codes.map((code) => (
                    <span className="font-mono text-ui-primary" key={code}>
                      {code}
                    </span>
                  ))}
                  <span>{line.planItem.unit_fa}</span>
                </div>
                {line.error ? (
                  <p className="mt-1 text-xs text-ui-danger">{line.error}</p>
                ) : null}
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-xs">
                <span className="text-ui-text-muted">مقدار</span>
                <input
                  className={classNames(inputClasses, "w-20 text-left text-sm")}
                  dir="ltr"
                  inputMode="decimal"
                  onChange={(e) => updateQuantity(index, e.target.value)}
                  value={String(line.payload.quantity)}
                />
              </label>
            </div>
          </GlassCard>
        ))}
      </div>

      {hasAnyError ? (
        <p className="rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-7 text-ui-danger">
          برخی ردیف‌ها خطا دارند. مقادیر را اصلاح کنید و دوباره ارسال کنید.
        </p>
      ) : null}

      {submitError ? (
        <p className="rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-7 text-ui-danger">
          {submitError}
        </p>
      ) : null}

      <button
        className={classNames(
          "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ui-primary py-3 text-base font-bold text-ui-primary-foreground transition hover:bg-ui-primary-hover disabled:opacity-50",
          submitClassName
        )}
        disabled={isSubmitting || lines.length === 0}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        افزودن {lines.length} ردیف به صورت‌بها
      </button>
    </div>
  );
}
