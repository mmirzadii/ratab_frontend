import { type FormEvent, useEffect, useState } from "react";
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
  useCreateFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import { EmptyState } from "../../../shared/components/EmptyState";
import { InfoBox } from "../../../shared/components/InfoBox";
import { cleanDisplayText, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { inputClasses } from "../constants";
import {
  getManualPriceValidationMessage,
  hasManualUnitPrice,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue
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
                onClick={() => setLocalLines((current) => current.filter((l) => l.id !== line.id))}
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
  onSelectedCoefficientSetIdChange,
  onDocumentUpdated,
  onClose,
  onToast,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  item: PricebookItemDetail;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onClose: () => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
  selectedCoefficientSetId: number | null;
}) {
  const [quantity, setQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<PricebookCalculateResponse | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);
  const [lineSuccess, setLineSuccess] = useState<string | null>(null);
  const [confirmedFootnotes, setConfirmedFootnotes] = useState<Record<number, boolean>>({});
  const [showAddedRows, setShowAddedRows] = useState(false);
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [manualUnitPriceError, setManualUnitPriceError] = useState<string | null>(null);
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();
  const requiresManualPrice = hasManualUnitPrice(item);
  const documentLocked = isFinancialDocumentLocked(document);
  const manualRows = item.rows.filter(
    (row) => row.requires_manual_unit_price || row.unit_price === null || row.unit_price === ""
  );
  const isCalculationLocked = Boolean(calculation);

  if (showAddedRows) {
    return <AddedRowsView document={document} onClose={onClose} onToast={onToast} />;
  }

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuantityError(null);
    setCalculationError(null);
    setLineError(null);
    setLineSuccess(null);
    setCalculation(null);
    setManualUnitPriceError(null);

    if (requiresManualPrice) {
      const normalizedManualPrice = normalizeQuantityValue(manualUnitPrice);
      if (!normalizedManualPrice) {
        setManualUnitPriceError("قیمت واحد پیشنهادی الزامی است.");
        return;
      }
      if (!isPositiveDecimal(normalizedManualPrice)) {
        setManualUnitPriceError("قیمت باید عدد مثبت معتبر باشد.");
        return;
      }
      setCalculationError(
        "قیمت واحد پیشنهادی دریافت شد. در نسخه v0.0 بک‌اند، ارسال قیمت دستی به سرور پشتیبانی نمی‌شود. این قابلیت در نسخه‌های بعدی پیاده‌سازی می‌شود."
      );
      return;
    }

    const normalizedQuantity = normalizeQuantityValue(quantity);
    if (!isPositiveDecimal(normalizedQuantity)) {
      setQuantityError("مقدار باید یک عدد مثبت باشد.");
      return;
    }

    try {
      const calculateBody: PricebookCalculateInputRequest = {
        quantity: normalizedQuantity
      };

      if (selectedCoefficientSetId) {
        calculateBody.coefficient_set_id = selectedCoefficientSetId;
      }

      const result = await calculatePricebookItem({
        itemId: item.id,
        body: calculateBody
      }).unwrap();
      setQuantity(normalizedQuantity);
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

    if (requiresManualPrice || calculation.requires_manual_unit_price) {
      setLineError(
        "آیتم‌های ستاره‌دار در نسخه v0.0 به صورت‌بها اضافه نمی‌شوند. بک‌اند این نسخه فیلد قیمت دستی را نمی‌پذیرد."
      );
      return;
    }

    if (!document) {
      setLineError("سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید.");
      return;
    }

    if (documentLocked) {
      setLineError("این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد.");
      return;
    }

    try {
      await createFinancialDocumentLine({
        documentId: document.id,
        body: {
          pricebook_item_id: item.id,
          quantity: calculation.quantity
        }
      }).unwrap();
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      onToast("ردیف به صورت‌بها اضافه شد.", "success");
      setShowAddedRows(true);
    } catch (error) {
      setLineError(getManualPriceValidationMessage(error));
    }
  }

  const addLineDisabledReason = requiresManualPrice
    ? "آیتم‌های ستاره‌دار در نسخه v0.0 به صورت‌بها اضافه نمی‌شوند (بک‌اند فیلد قیمت دستی را در این نسخه نمی‌پذیرد)."
    : !calculation
      ? "بعد از محاسبه موفق می‌توانید آیتم را به صورت‌بها اضافه کنید."
      : calculation.requires_manual_unit_price
        ? "آیتم‌های ستاره‌دار در نسخه v0.0 به صورت‌بها اضافه نمی‌شوند (بک‌اند فیلد قیمت دستی را در این نسخه نمی‌پذیرد)."
        : !document
          ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
          : documentLocked
            ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
            : null;

  return (
    <div className="space-y-5">
      <CalculationSection
        addLineDisabledReason={addLineDisabledReason}
        calculation={calculation}
        calculationError={calculationError}
        isCalculating={calculateState.isLoading}
        manualRows={manualRows}
        manualUnitPrice={manualUnitPrice}
        manualUnitPriceError={manualUnitPriceError}
        onCalculate={handleCalculate}
        onManualUnitPriceChange={setManualUnitPrice}
        quantity={quantity}
        quantityError={quantityError}
        requiresManualPrice={requiresManualPrice}
        isAddingLine={createLineState.isLoading || recalculateState.isLoading}
        lineError={lineError}
        lineSuccess={lineSuccess}
        onAddLine={handleAddLine}
        canAddLine={!addLineDisabledReason}
        isCalculationLocked={isCalculationLocked}
        onEditCalculation={handleEditCalculation}
        setQuantity={setQuantity}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoBox label="واحد" value={item.unit} />
        <InfoBox label="قیمت واحد" value={formatMoneyAmount(item.unit_price)} />
        <InfoBox
          label="وضعیت قیمت"
          value={requiresManualPrice ? "نیازمند قیمت دستی" : "قیمت رسمی"}
        />
      </div>

      {requiresManualPrice ? (
        <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
          این آیتم یا یکی از ردیف‌های آن قیمت رسمی ندارد. متریل هرگز قیمت خالی را صفر فرض نمی‌کند؛
          محاسبه قیمت دستی در فاز بعدی با پیام روشن انجام می‌شود.
        </div>
      ) : null}

      <ChecklistNotesSection
        disabled={isCalculationLocked}
        notes={item.footnotes}
        onToggle={(noteId, checked) =>
          setConfirmedFootnotes((current) => ({ ...current, [noteId]: checked }))
        }
        selectedNotes={confirmedFootnotes}
      />

      <section>
        <h3 className="text-base font-black text-white light:text-slate-950">ردیف‌های فهرست‌بها</h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-white/10 light:border-slate-200">
          <div className="grid grid-cols-[100px_1fr_90px_140px] bg-white/7 px-4 py-3 text-xs font-bold text-slate-300 light:bg-slate-50 light:text-slate-600">
            <span>کد ردیف</span>
            <span>شرح</span>
            <span>واحد</span>
            <span>قیمت</span>
          </div>
          {item.rows.map((row) => (
            <div
              className="grid grid-cols-[100px_1fr_90px_140px] gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-200 light:border-slate-200 light:text-slate-700"
              key={row.id}
            >
              <span className="font-mono text-emerald-200 light:text-emerald-700">
                {row.row_code}
              </span>
              <span>{row.title_fa || row.short_title_fa}</span>
              <span>{row.unit}</span>
              <span>
                {row.requires_manual_unit_price
                  ? "قیمت دستی"
                  : formatMoneyAmount(row.unit_price)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <label className="block space-y-2 rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
        <span className="text-sm font-bold text-slate-200 light:text-slate-700">
          مجموعه ضرایب برای محاسبه
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
        {coefficientSets.length === 0 ? (
          <span className="text-xs leading-6 text-slate-400 light:text-slate-500">
            برای محاسبه با ضریب، ابتدا در بخش ضرایب پروژه مجموعه بسازید.
          </span>
        ) : null}
      </label>

      <ReadableNotesSection notes={item.requirements} title="الزامات" />
    </div>
  );
}

export function ItemDetailModal({
  coefficientSets,
  document,
  itemId,
  onSelectedCoefficientSetIdChange,
  onDocumentUpdated,
  onClose,
  onToast,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  itemId: number;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onClose: () => void;
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
              onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
              onDocumentUpdated={onDocumentUpdated}
              onClose={onClose}
              onToast={onToast}
              selectedCoefficientSetId={selectedCoefficientSetId}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
