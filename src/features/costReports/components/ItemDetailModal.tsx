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
  type FinancialDocumentLineCreateRequest,
  useCreateFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import { EmptyState } from "../../../shared/components/EmptyState";
import { cleanDisplayText, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { classNames } from "../../../shared/utils/classNames";
import {
  getManualPriceValidationMessage,
  hasManualUnitPrice,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue,
  requiresRowSelection
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
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [manualUnitPriceError, setManualUnitPriceError] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<PricebookCalculateResponse | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);
  const [lineSuccess, setLineSuccess] = useState<string | null>(null);
  const [confirmedFootnotes, setConfirmedFootnotes] = useState<Record<number, boolean>>({});
  const [showAddedRows, setShowAddedRows] = useState(false);
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();
  const requiresManualPrice = hasManualUnitPrice(item);
  const needsRowSelection = requiresRowSelection(item);
  const documentLocked = isFinancialDocumentLocked(document);
  const isCalculationLocked = Boolean(calculation);

  if (showAddedRows) {
    return <AddedRowsView document={document} onClose={onClose} onToast={onToast} />;
  }

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuantityError(null);
    setManualUnitPriceError(null);
    setCalculationError(null);
    setLineError(null);
    setLineSuccess(null);
    setCalculation(null);

    const normalizedQuantity = normalizeQuantityValue(quantity);
    if (!isPositiveDecimal(normalizedQuantity)) {
      setQuantityError("مقدار باید یک عدد مثبت باشد.");
      return;
    }

    if (needsRowSelection && selectedRowId === null) {
      setCalculationError("ابتدا یک ردیف از لیست زیر انتخاب کنید.");
      return;
    }

    let normalizedManualPrice: string | undefined;
    if (requiresManualPrice) {
      const normalized = normalizeQuantityValue(manualUnitPrice);
      if (!isPositiveDecimal(normalized)) {
        setManualUnitPriceError("قیمت واحد باید یک عدد مثبت وارد شود.");
        return;
      }
      normalizedManualPrice = normalized;
    }

    try {
      const calculateBody: PricebookCalculateInputRequest = {
        quantity: normalizedQuantity
      };

      if (selectedCoefficientSetId) {
        calculateBody.coefficient_set_id = selectedCoefficientSetId;
      }

      if (normalizedManualPrice !== undefined) {
        calculateBody.manual_unit_price = normalizedManualPrice;
      }

      if (selectedRowId !== null) {
        calculateBody.pricebook_row_id = selectedRowId;
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

    if (!document) {
      setLineError("سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید.");
      return;
    }

    if (documentLocked) {
      setLineError("این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد.");
      return;
    }

    const lineBody: FinancialDocumentLineCreateRequest = {
      pricebook_item_id: item.id,
      quantity: calculation.quantity
    };

    if (requiresManualPrice) {
      const normalized = normalizeQuantityValue(manualUnitPrice);
      if (isPositiveDecimal(normalized)) {
        lineBody.manual_unit_price = normalized;
      }
    }

    if (selectedRowId !== null) {
      lineBody.pricebook_row_id = selectedRowId;
    }

    try {
      await createFinancialDocumentLine({
        documentId: document.id,
        body: lineBody
      }).unwrap();
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      onToast("ردیف به صورت‌بها اضافه شد.", "success");
      setShowAddedRows(true);
    } catch (error) {
      const msg = getManualPriceValidationMessage(error);
      setLineError(msg);
      if (
        typeof error === "object" && error !== null && "data" in error &&
        typeof (error as { data?: unknown }).data === "object"
      ) {
        const d = (error as { data: Record<string, unknown> }).data;
        if (d["requires_row_selection"] === true || String(d["requires_row_selection"]) === "True") {
          onToast("این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید.", "error");
        }
      }
    }
  }

  const addLineDisabledReason = needsRowSelection && selectedRowId === null
    ? "ابتدا یک ردیف از لیست زیر انتخاب کنید."
    : !calculation
      ? "بعد از محاسبه موفق می‌توانید آیتم را به صورت‌بها اضافه کنید."
      : !document
        ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
        : documentLocked
          ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
          : null;

  return (
    <div className="space-y-4">
      {needsRowSelection ? (
        <section className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 light:bg-amber-50">
          <h3 className="text-base font-black text-white light:text-slate-950">انتخاب ردیف</h3>
          <p className="mt-2 text-sm leading-7 text-amber-100 light:text-amber-800">
            این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید.
          </p>
          <div className="mt-3 space-y-2">
            {item.rows.map((row) => (
              <label
                key={row.id}
                className={classNames(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                  selectedRowId === row.id
                    ? "border-emerald-400/50 bg-emerald-400/15 light:border-emerald-500 light:bg-emerald-50"
                    : "border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-200 light:bg-white light:hover:bg-slate-50"
                )}
              >
                <input
                  checked={selectedRowId === row.id}
                  className="mt-0.5 shrink-0 accent-emerald-400"
                  disabled={isCalculationLocked}
                  name="pricebook_row"
                  onChange={() => {
                    setSelectedRowId(row.id);
                    setCalculation(null);
                    setCalculationError(null);
                  }}
                  type="radio"
                  value={row.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-emerald-200 light:text-emerald-700">
                      {row.row_code}
                    </span>
                    <span className="text-sm text-slate-200 light:text-slate-800">
                      {row.title_fa || row.short_title_fa}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400 light:text-slate-500">
                    <span>واحد: {row.unit}</span>
                    {row.unit_price ? (
                      <span>قیمت: {formatMoneyAmount(row.unit_price)}</span>
                    ) : (
                      <span className="text-amber-300 light:text-amber-700">قیمت دستی</span>
                    )}
                    {row.min_value ? <span>از: {row.min_value}</span> : null}
                    {row.max_value ? <span>تا: {row.max_value}</span> : null}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <CalculationSection
        addLineDisabledReason={addLineDisabledReason}
        calculation={calculation}
        calculationError={calculationError}
        coefficientSets={coefficientSets}
        isCalculating={calculateState.isLoading}
        onCalculate={handleCalculate}
        onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
        quantity={quantity}
        quantityError={quantityError}
        requiresManualPrice={requiresManualPrice}
        requiresRowSelection={needsRowSelection}
        isAddingLine={createLineState.isLoading || recalculateState.isLoading}
        lineError={lineError}
        lineSuccess={lineSuccess}
        manualUnitPrice={manualUnitPrice}
        manualUnitPriceError={manualUnitPriceError}
        onAddLine={handleAddLine}
        canAddLine={!addLineDisabledReason}
        isCalculationLocked={isCalculationLocked}
        onEditCalculation={handleEditCalculation}
        selectedCoefficientSetId={selectedCoefficientSetId}
        setManualUnitPrice={setManualUnitPrice}
        setQuantity={setQuantity}
      />

      <ChecklistNotesSection
        disabled={isCalculationLocked}
        notes={item.footnotes}
        onToggle={(noteId, checked) =>
          setConfirmedFootnotes((current) => ({ ...current, [noteId]: checked }))
        }
        selectedNotes={confirmedFootnotes}
      />

      {!needsRowSelection ? (
        <section>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-400 light:text-slate-500">ردیف فهرست‌بها</h3>
          <div className="mt-2 space-y-2">
            {item.rows.map((row) => (
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-white/7 px-3 py-2.5 text-sm light:border-slate-200 light:bg-slate-50"
                key={row.id}
              >
                <span className="font-mono font-bold text-emerald-200 light:text-emerald-700">
                  {row.row_code}
                </span>
                <span className="flex-1 text-slate-100 light:text-slate-800">
                  {row.title_fa || row.short_title_fa}
                </span>
                <span className="text-slate-400 light:text-slate-500">{row.unit}</span>
                <span className="font-bold text-slate-200 light:text-slate-700">
                  {row.requires_manual_unit_price ? "قیمت دستی" : formatMoneyAmount(row.unit_price)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
