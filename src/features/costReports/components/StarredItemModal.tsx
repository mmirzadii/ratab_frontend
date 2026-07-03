import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Star, X, XCircle } from "lucide-react";

import type {
  FinancialDocument,
  FinancialDocumentLineCreatePayload
} from "../../financialDocuments/financialDocumentApi";
import {
  useCreateFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { classNames } from "../../../shared/utils/classNames";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { inputClasses, textareaClasses } from "../constants";
import {
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue
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
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateDocument, recalculateState] = useRecalculateFinancialDocumentMutation();

  const locked = isFinancialDocumentLocked(document);
  const isSubmitting = createLineState.isLoading || recalculateState.isLoading;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.document.addEventListener("keydown", handleKeyDown);
    return () => window.document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const normalizedQuantity = normalizeQuantityValue(form.quantity);
  const normalizedUnitPrice = normalizeQuantityValue(form.unitPrice);

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

  const totalPreview =
    isPositiveDecimal(normalizedQuantity) && isPositiveDecimal(normalizedUnitPrice)
      ? String(Number(normalizedQuantity) * Number(normalizedUnitPrice))
      : null;

  function shouldShowError(field: keyof StarredItemForm) {
    return Boolean(errors[field] && (hasSubmitAttempted || touched[field]));
  }

  function updateField(field: keyof StarredItemForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  function markTouched(field: keyof StarredItemForm) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitAttempted(true);
    setFormError(null);

    if (locked) {
      setFormError("این صورت‌بها قفل شده و امکان افزودن آیتم ستاره‌دار ندارد.");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormError("فیلدهای لازم را کامل و معتبر وارد کنید.");
      return;
    }

    const body: FinancialDocumentLineCreatePayload = {
      description_fa: form.description.trim() || undefined,
      line_source: "starred",
      manual_unit_price: normalizedUnitPrice,
      quantity: normalizedQuantity,
      title_fa: form.title.trim(),
      unit: form.unit.trim()
    };

    try {
      await createLine({ body, documentId: document.id }).unwrap();
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      onToast("آیتم ستاره‌دار به صورت‌بها اضافه شد.", "success");
      onClose();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <form
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl light:border-slate-200 light:bg-white"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 p-4 light:border-slate-200 light:bg-white/95">
          <button
            aria-label="بستن"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-white disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-right">
            <h2 className="flex items-center justify-end gap-2 text-base font-black text-white light:text-slate-950">
              آیتم ستاره‌دار
              <Star className="h-4 w-4 text-amber-300" />
            </h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              یک ردیف مستقل با بهای دستی به صورت‌بها اضافه می‌شود.
            </p>
          </div>
        </div>

        <div className="max-h-[75dvh] space-y-4 overflow-y-auto p-4">
          {locked ? (
            <div className="rounded-lg border border-violet-300/25 bg-violet-400/10 p-3 text-sm leading-7 text-violet-100 light:text-violet-800">
              این صورت‌بها قفل شده و امکان افزودن آیتم ستاره‌دار ندارد.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان آیتم" required>
              <input
                className={inputClasses}
                disabled={isSubmitting || locked}
                onBlur={() => markTouched("title")}
                onChange={(event) => updateField("title", event.target.value)}
                value={form.title}
              />
              {shouldShowError("title") ? (
                <p className="text-xs text-rose-300 light:text-rose-700">{errors.title}</p>
              ) : null}
            </Field>

            <Field label="واحد" required>
              <input
                className={inputClasses}
                disabled={isSubmitting || locked}
                onBlur={() => markTouched("unit")}
                onChange={(event) => updateField("unit", event.target.value)}
                value={form.unit}
              />
              {shouldShowError("unit") ? (
                <p className="text-xs text-rose-300 light:text-rose-700">{errors.unit}</p>
              ) : null}
            </Field>

            <Field label="مقدار" required>
              <input
                className={classNames(inputClasses, "text-left")}
                dir="ltr"
                disabled={isSubmitting || locked}
                inputMode="decimal"
                onBlur={() => markTouched("quantity")}
                onChange={(event) => updateField("quantity", event.target.value)}
                value={form.quantity}
              />
              {shouldShowError("quantity") ? (
                <p className="text-xs text-rose-300 light:text-rose-700">{errors.quantity}</p>
              ) : null}
            </Field>

            <Field label="بهای واحد" required>
              <input
                className={classNames(inputClasses, "text-left")}
                dir="ltr"
                disabled={isSubmitting || locked}
                inputMode="decimal"
                onBlur={() => markTouched("unitPrice")}
                onChange={(event) => updateField("unitPrice", event.target.value)}
                value={form.unitPrice}
              />
              {shouldShowError("unitPrice") ? (
                <p className="text-xs text-rose-300 light:text-rose-700">{errors.unitPrice}</p>
              ) : null}
            </Field>
          </div>

          <Field label="توضیحات اختیاری">
            <textarea
              className={textareaClasses}
              disabled={isSubmitting || locked}
              onBlur={() => markTouched("description")}
              onChange={(event) => updateField("description", event.target.value)}
              rows={3}
              value={form.description}
            />
          </Field>

          <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
            <p className="text-xs font-bold text-slate-400 light:text-slate-500">
              مبلغ کل
            </p>
            <p className="mt-1 text-lg font-black text-emerald-300 light:text-emerald-700">
              {totalPreview ? formatMoneyAmount(totalPreview) : "پس از ورود مقدار و بها نمایش داده می‌شود"}
            </p>
          </div>

          {formError ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              <XCircle className="mt-1 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 light:border-slate-200 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
            انصراف
          </Button>
          <Button disabled={isSubmitting || locked} type="submit">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            افزودن آیتم
          </Button>
        </div>
      </form>
    </div>
  );
}
