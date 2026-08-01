import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Star, X, XCircle } from "lucide-react";

import type {
  FinancialDocument,
  StarredCalculationRequest
} from "../../financialDocuments/financialDocumentApi";
import {
  useCreateFinancialDocumentLineMutation,
  useCreateStarredCalculationMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import {
  createCalculationIdempotencyKey,
  createLineIdempotencyKey,
  formatBillingBreakdown,
  formatCalculationCostLabel,
  getCombinedInsufficientBalance,
  isIdempotencyKeyReused,
  isInsufficientCombinedTokenBalance,
  useGetTokenWalletQuery,
  type CombinedTokenBillingError
} from "../../wallet/walletApi";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { InsufficientTokenModal } from "../../../shared/components/InsufficientTokenModal";
import { MathNumericInput } from "../../../shared/math/MathNumericInput";
import { classNames } from "../../../shared/utils/classNames";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import {
  isStarredCalculationResult,
  starredAuthoritativeTotal,
  type StarredCalculationResult
} from "../calculationTypes";
import { inputClasses, textareaClasses } from "../constants";
import {
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue,
  stablePayloadKey
} from "../costReportUtils";

type StarredItemForm = {
  description: string;
  quantity: string;
  title: string;
  unit: string;
  unitPrice: string;
};

type StarredItemErrors = Partial<Record<keyof StarredItemForm, string>>;
type TouchedFields = Partial<Record<keyof StarredItemForm, boolean>>;

const initialForm: StarredItemForm = {
  description: "",
  quantity: "",
  title: "",
  unit: "",
  unitPrice: ""
};

function buildStarredDescription(form: StarredItemForm): string {
  const title = form.title.trim();
  const extra = form.description.trim();
  return extra ? `${title}\n${extra}` : title;
}

export function StarredItemModal({
  document,
  onClose,
  onDocumentUpdated,
  onToast
}: {
  document: FinancialDocument;
  onClose: () => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [form, setForm] = useState<StarredItemForm>(initialForm);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [hasCalculateAttempted, setHasCalculateAttempted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [starredResult, setStarredResult] = useState<StarredCalculationResult | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [billingLabel, setBillingLabel] = useState<string | null>(null);
  const [calculatedPayloadKey, setCalculatedPayloadKey] = useState<string | null>(null);
  const [insufficientError, setInsufficientError] = useState<CombinedTokenBillingError | null>(
    null
  );

  const calcIdempotencyRef = useRef<{ payloadKey: string; key: string } | null>(null);
  const lineIdempotencyRef = useRef<{ receiptId: number; key: string } | null>(null);

  const { data: tokenWallet } = useGetTokenWalletQuery();
  const [createStarredCalculation, createStarredState] = useCreateStarredCalculationMutation();
  const [createLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateDocument, recalculateState] = useRecalculateFinancialDocumentMutation();

  const locked = isFinancialDocumentLocked(document);
  const isCalculating = createStarredState.isLoading;
  const isAdding = createLineState.isLoading || recalculateState.isLoading;
  const isBusy = isCalculating || isAdding;

  const calculateCostLabel = formatCalculationCostLabel(tokenWallet?.starred_calculation_cost);
  const canCalculate = Boolean(calculateCostLabel) && !locked && !isBusy;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    }

    window.document.addEventListener("keydown", handleKeyDown);
    return () => window.document.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onClose]);

  const normalizedQuantity = normalizeQuantityValue(form.quantity);
  const normalizedUnitPrice = normalizeQuantityValue(form.unitPrice);
  const description = buildStarredDescription(form);
  const unit = form.unit.trim();

  const requestFields = useMemo(() => {
    const fields: Omit<StarredCalculationRequest, "idempotency_key"> = {
      description,
      quantity: normalizedQuantity,
      unit,
      unit_price: normalizedUnitPrice
    };
    if (document.coefficient_set_id) {
      fields.coefficient_set_id = document.coefficient_set_id;
    }
    return fields;
  }, [description, document.coefficient_set_id, normalizedQuantity, normalizedUnitPrice, unit]);

  const payloadKey = useMemo(() => stablePayloadKey(requestFields), [requestFields]);

  const errors = useMemo<StarredItemErrors>(() => {
    const nextErrors: StarredItemErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "عنوان آیتم الزامی است.";
    }
    if (!form.unit.trim()) {
      nextErrors.unit = "واحد الزامی است.";
    }
    if (!isPositiveDecimal(normalizedQuantity)) {
      nextErrors.quantity = "مقدار باید یک عدد مثبت باشد.";
    }
    if (!isPositiveDecimal(normalizedUnitPrice)) {
      nextErrors.unitPrice = "بهای واحد باید یک عدد مثبت باشد.";
    }

    return nextErrors;
  }, [form.title, form.unit, normalizedQuantity, normalizedUnitPrice]);

  const localPreview =
    isPositiveDecimal(normalizedQuantity) && isPositiveDecimal(normalizedUnitPrice)
      ? String(Number(normalizedQuantity) * Number(normalizedUnitPrice))
      : null;

  const hasCurrentReceipt =
    receiptId !== null &&
    starredResult !== null &&
    calculatedPayloadKey === payloadKey;

  const authoritativeTotal = starredResult ? starredAuthoritativeTotal(starredResult) : "";

  function shouldShowError(field: keyof StarredItemForm) {
    return Boolean(errors[field] && (hasCalculateAttempted || touched[field]));
  }

  function clearCalculationResult() {
    setStarredResult(null);
    setReceiptId(null);
    setBillingLabel(null);
    setCalculatedPayloadKey(null);
  }

  function updateField(field: keyof StarredItemForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
    clearCalculationResult();
  }

  function markTouched(field: keyof StarredItemForm) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleCalculate(event?: FormEvent) {
    event?.preventDefault();
    setHasCalculateAttempted(true);
    setFormError(null);
    setInsufficientError(null);

    if (locked) {
      setFormError("این صورت‌بها قفل شده و امکان افزودن آیتم ستاره‌دار ندارد.");
      return;
    }

    if (!calculateCostLabel) {
      setFormError("هزینه محاسبه در دسترس نیست. لطفاً دوباره تلاش کنید.");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormError("فیلدهای لازم را کامل و معتبر وارد کنید.");
      clearCalculationResult();
      return;
    }

    if (isBusy) return;

    if (calcIdempotencyRef.current?.payloadKey !== payloadKey) {
      calcIdempotencyRef.current = {
        payloadKey,
        key: createCalculationIdempotencyKey()
      };
    }

    const body: StarredCalculationRequest = {
      ...requestFields,
      idempotency_key: calcIdempotencyRef.current.key
    };

    try {
      const billingResult = await createStarredCalculation({
        body,
        documentId: document.id
      }).unwrap();

      if (!isStarredCalculationResult(billingResult.result)) {
        clearCalculationResult();
        setFormError("نتیجه محاسبه معتبر نیست. دوباره تلاش کنید.");
        return;
      }

      const total = starredAuthoritativeTotal(billingResult.result);
      if (!total) {
        clearCalculationResult();
        setFormError("مبلغ محاسبه‌شده از سرور دریافت نشد. دوباره تلاش کنید.");
        return;
      }

      setStarredResult(billingResult.result);
      setReceiptId(billingResult.receipt.id);
      setBillingLabel(formatBillingBreakdown(billingResult.billing));
      setCalculatedPayloadKey(payloadKey);
      lineIdempotencyRef.current = null;
    } catch (error) {
      clearCalculationResult();
      if (isInsufficientCombinedTokenBalance(error)) {
        setInsufficientError(getCombinedInsufficientBalance(error));
        return;
      }
      if (isIdempotencyKeyReused(error)) {
        calcIdempotencyRef.current = null;
        setFormError("کلید تکرار محاسبه قبلاً برای درخواست دیگری استفاده شده است. دوباره تلاش کنید.");
        return;
      }
      setFormError(getApiErrorMessage(error, "محاسبه انجام نشد. لطفاً دوباره تلاش کنید."));
    }
  }

  async function handleAdd() {
    setFormError(null);
    setInsufficientError(null);

    if (locked) {
      setFormError("این صورت‌بها قفل شده و امکان افزودن آیتم ستاره‌دار ندارد.");
      return;
    }

    if (!hasCurrentReceipt || receiptId === null) {
      setFormError("ابتدا محاسبه را با موفقیت انجام دهید.");
      return;
    }

    if (isBusy) return;

    if (lineIdempotencyRef.current?.receiptId !== receiptId) {
      lineIdempotencyRef.current = {
        receiptId,
        key: createLineIdempotencyKey()
      };
    }

    try {
      await createLine({
        body: {
          calculation_receipt_id: receiptId,
          idempotency_key: lineIdempotencyRef.current.key
        },
        documentId: document.id
      }).unwrap();
      lineIdempotencyRef.current = null;
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      onToast("آیتم ستاره‌دار به صورت‌بها اضافه شد.", "success");
      onClose();
    } catch (error) {
      if (isIdempotencyKeyReused(error)) {
        lineIdempotencyRef.current = null;
        setFormError("کلید تکرار ثبت قبلاً برای درخواست دیگری استفاده شده است. دوباره تلاش کنید.");
        return;
      }
      setFormError(getApiErrorMessage(error, "افزودن آیتم انجام نشد. لطفاً دوباره تلاش کنید."));
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[110] flex items-end justify-center bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isBusy) {
            onClose();
          }
        }}
      >
        <form
          className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-ui-border-subtle bg-ui-surface shadow-ui sm:h-auto sm:max-h-[90dvh] sm:rounded-lg"
          onMouseDown={(event) => event.stopPropagation()}
          onSubmit={handleCalculate}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ui-border-subtle bg-ui-surface px-3 py-1.5 sm:p-4">
            <button
              aria-label="بستن"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50 sm:h-9 sm:w-9"
              disabled={isBusy}
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 text-right">
              <h2 className="flex items-center justify-end gap-2 text-base font-black text-ui-text-primary">
                آیتم ستاره‌دار
                <Star className="h-4 w-4 text-amber-300" />
              </h2>
              <p className="mt-1 hidden text-xs text-ui-text-muted sm:block">
                پس از محاسبه رسمی، ردیف از روی رسید صورتحساب به سند اضافه می‌شود.
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 overscroll-contain sm:space-y-4 sm:p-4">
            {locked ? (
              <div className="rounded-lg border border-ui-primary/30 bg-ui-primary-soft p-3 text-sm leading-7 text-ui-primary">
                این صورت‌بها قفل شده و امکان افزودن آیتم ستاره‌دار ندارد.
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Field label="عنوان آیتم" required>
                <input
                  className={inputClasses}
                  disabled={isBusy || locked}
                  onBlur={() => markTouched("title")}
                  onChange={(event) => updateField("title", event.target.value)}
                  value={form.title}
                />
                {shouldShowError("title") ? (
                  <p className="text-xs text-rose-300">{errors.title}</p>
                ) : null}
              </Field>

              <Field label="واحد" required>
                <input
                  className={inputClasses}
                  disabled={isBusy || locked}
                  onBlur={() => markTouched("unit")}
                  onChange={(event) => updateField("unit", event.target.value)}
                  value={form.unit}
                />
                {shouldShowError("unit") ? (
                  <p className="text-xs text-rose-300">{errors.unit}</p>
                ) : null}
              </Field>

              <Field label="مقدار" required>
                <MathNumericInput
                  className={classNames(inputClasses, "text-left")}
                  dir="ltr"
                  disabled={isBusy || locked}
                  inputMode="decimal"
                  onBlur={() => markTouched("quantity")}
                  onChange={(next) => updateField("quantity", next)}
                  value={form.quantity}
                />
                {shouldShowError("quantity") ? (
                  <p className="text-xs text-rose-300">{errors.quantity}</p>
                ) : null}
              </Field>

              <Field label="بهای واحد" required>
                <MathNumericInput
                  className={classNames(inputClasses, "text-left")}
                  dir="ltr"
                  disabled={isBusy || locked}
                  inputMode="decimal"
                  onBlur={() => markTouched("unitPrice")}
                  onChange={(next) => updateField("unitPrice", next)}
                  value={form.unitPrice}
                />
                {shouldShowError("unitPrice") ? (
                  <p className="text-xs text-rose-300">{errors.unitPrice}</p>
                ) : null}
              </Field>
            </div>

            <button
              aria-controls="optional-starred-description"
              aria-expanded={isDescriptionOpen}
              className="flex min-h-11 w-full items-center justify-between rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-3 text-sm font-bold text-ui-text-secondary sm:hidden"
              onClick={() => setIsDescriptionOpen((current) => !current)}
              type="button"
            >
              افزودن توضیحات (اختیاری)
              <ChevronDown
                className={classNames(
                  "h-4 w-4 transition-transform",
                  isDescriptionOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={classNames(
                "mt-3 sm:mt-0 sm:block",
                isDescriptionOpen ? "block" : "hidden"
              )}
              id="optional-starred-description"
            >
              <label className="block space-y-2">
                <span className="hidden text-sm font-bold text-ui-text-secondary sm:block">
                  توضیحات اختیاری
                </span>
                <textarea
                  aria-label="توضیحات اختیاری"
                  className={textareaClasses}
                  disabled={isBusy || locked}
                  onBlur={() => markTouched("description")}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={3}
                  value={form.description}
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3 sm:block">
              <p className="shrink-0 text-xs font-bold text-ui-text-muted">
                برآورد محلی (غیررسمی)
              </p>
              <p className="min-w-0 text-left text-sm font-black text-ui-text-secondary sm:mt-1 sm:text-right sm:text-lg">
                {localPreview
                  ? formatMoneyAmount(localPreview)
                  : "پس از ورود مقدار و بها نمایش داده می‌شود"}
              </p>
            </div>

            <div className="rounded-lg border border-ui-primary/20 bg-ui-primary-soft p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-ui-text-muted">
                  {calculateCostLabel ?? "هزینه محاسبه در دسترس نیست"}
                </p>
                <button
                  className="inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-lg border border-ui-primary/30 bg-ui-primary-soft px-4 text-sm font-black text-ui-primary transition hover:bg-ui-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canCalculate}
                  type="submit"
                >
                  {isCalculating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  محاسبه
                </button>
              </div>

              {hasCurrentReceipt && authoritativeTotal ? (
                <div className="mt-3 rounded-lg border border-ui-border-subtle bg-ui-surface/30 p-3">
                  <p className="text-xs font-bold text-ui-text-muted">
                    مبلغ محاسبه‌شده
                  </p>
                  <p className="mt-1 text-xl font-black text-ui-primary">
                    {formatMoneyAmount(authoritativeTotal)}
                  </p>
                  {billingLabel ? (
                    <p className="mt-1 text-xs font-bold text-amber-100">
                      {billingLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {formError ? (
              <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100">
                <XCircle className="mt-1 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            ) : null}
          </div>

          <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t border-ui-border-subtle px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex sm:justify-end sm:p-4">
            <Button className="px-3" disabled={isBusy} onClick={onClose} type="button" variant="secondary">
              انصراف
            </Button>
            <Button
              disabled={isBusy || locked || !hasCurrentReceipt}
              onClick={handleAdd}
              type="button"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              افزودن آیتم
            </Button>
          </div>
        </form>
      </div>

      {insufficientError ? (
        <InsufficientTokenModal
          error={insufficientError}
          onClose={() => setInsufficientError(null)}
        />
      ) : null}
    </>
  );
}
