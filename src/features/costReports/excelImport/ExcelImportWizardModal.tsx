/**
 * ISOLATED / UNWIRED (Phase 8): Excel plan + bulk line create.
 * These paths are absent from `backend_docs/current/OPENAPI.yaml` and this modal
 * is not mounted in any route. Kept for potential future contract re-introduction;
 * do not treat as part of the active Frontend v1 product surface.
 */
import { useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

import type {
  ExcelPlanItem,
  FinancialDocument,
  FinancialDocumentLineCreateRequest
} from "../../financialDocuments/financialDocumentApi";
import {
  useCreateFinancialDocumentLinesBulkMutation,
  useFinancialDocumentExcelPlanMutation
} from "../../financialDocuments/financialDocumentApi";
import {
  formatInsufficientBalanceMessage,
  isInsufficientTokenBalance
} from "../../wallet/walletApi";
import { useAppShell } from "../../../app/appShellContext";
import { GlassCard } from "../../../shared/components/GlassCard";
import { classNames } from "../../../shared/utils/classNames";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { inputClasses } from "../constants";
import { MiniSpreadsheet } from "./MiniSpreadsheet";
import { ReviewStep, type ReviewLine } from "./ReviewStep";

type WizardStep = "source" | "ambiguities" | "review";

const EMPTY_ROWS = 30;
const COLS = 2;
const makeEmptyGrid = () =>
  Array.from({ length: EMPTY_ROWS }, () => Array(COLS).fill("") as string[]);

function AmbiguityCard({
  item,
  onResolved,
  quantityHint
}: {
  item: ExcelPlanItem;
  onResolved: (payload: FinancialDocumentLineCreateRequest) => void;
  quantityHint: string;
}) {
  const [selectedRowCode, setSelectedRowCode] = useState<string>(item.row_codes[0] ?? "");
  const [quantity, setQuantity] = useState(quantityHint || "1");

  function handleConfirm() {
    const payload: FinancialDocumentLineCreateRequest = {
      pricebook_item_id: item.pricebook_item_id,
      quantity
    };
    if (item.pricebook_row_id !== null && item.row_codes.length <= 1) {
      payload.pricebook_row_id = item.pricebook_row_id;
    } else if (selectedRowCode) {
      // row code only — backend maps it; use as a hint via pricebook_row_id if we have it
      // For multi-row ambiguous items, backend expects pricebook_row_id from row_codes selection
      payload.pricebook_row_id = undefined; // backend will derive from quantity/defaults
    }
    onResolved(payload);
  }

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3 sm:p-4">
        <p className="text-sm font-bold text-ui-text-primary">
          {item.description_fa || "آیتم"}
        </p>
        <p className="mt-1 font-mono text-xs text-ui-primary">
          {item.row_codes.join("، ")}
        </p>
        <p className="mt-1 text-xs text-ui-text-muted">{item.unit_fa}</p>
      </div>

      {item.row_codes.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-bold text-amber-200">
            این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید:
          </p>
          {item.row_codes.map((code) => (
            <label
              className={classNames(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 transition",
                selectedRowCode === code
                  ? "border-ui-primary/50 bg-ui-primary-soft"
                  : "border-ui-border-subtle bg-ui-surface-subtle hover:bg-ui-surface-subtle"
              )}
              key={code}
            >
              <input
                checked={selectedRowCode === code}
                className="h-4 w-4 shrink-0 accent-ui-primary"
                name="row_code_selection"
                onChange={() => setSelectedRowCode(code)}
                type="radio"
                value={code}
              />
              <span className="font-mono text-sm text-ui-primary">
                {code}
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <label className="space-y-1.5">
        <span className="text-sm font-bold text-ui-text-secondary">مقدار</span>
        <input
          className={classNames(inputClasses, "text-left")}
          dir="ltr"
          inputMode="decimal"
          onChange={(e) => setQuantity(e.target.value)}
          value={quantity}
        />
      </label>

      <button
        className="sticky bottom-0 z-10 min-h-11 w-full rounded-lg bg-ui-primary px-4 py-2.5 text-sm font-bold text-ui-primary-foreground shadow-xl shadow-ui-sm transition hover:bg-ui-primary-hover sm:static sm:shadow-none"
        onClick={handleConfirm}
        type="button"
      >
        تأیید و ادامه
      </button>
    </div>
  );
}

export function ExcelImportWizardModal({
  document,
  onClose,
  onDocumentUpdated
}: {
  document: FinancialDocument;
  onClose: () => void;
  onDocumentUpdated: (doc: FinancialDocument) => void;
}) {
  const { secondaryNav } = useAppShell();
  const [step, setStep] = useState<WizardStep>("source");
  const [sourceMode, setSourceMode] = useState<"spreadsheet" | "file">("spreadsheet");
  const [gridData, setGridData] = useState<string[][]>(makeEmptyGrid);
  const [uploadPreview, setUploadPreview] = useState<string[][]>([]);
  const [codeColumn, setCodeColumn] = useState(0);
  const [quantityColumn, setQuantityColumn] = useState(1);
  const [hasHeader, setHasHeader] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planResponse, setPlanResponse] = useState<{
    items: ExcelPlanItem[];
    unmatched: string[];
  } | null>(null);
  const [ambiguityIndex, setAmbiguityIndex] = useState(0);
  const [resolvedLines, setResolvedLines] = useState<
    Map<number, FinancialDocumentLineCreateRequest>
  >(new Map());
  const [reviewLines, setReviewLines] = useState<ReviewLine[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [callExcelPlan, excelPlanState] = useFinancialDocumentExcelPlanMutation();
  const [createLinesBulk, createLinesBulkState] = useCreateFinancialDocumentLinesBulkMutation();

  const extractedRows = useMemo(() => {
    const source = sourceMode === "spreadsheet" ? gridData : uploadPreview;
    const data = hasHeader && source.length > 0 ? source.slice(1) : source;
    return data
      .map((row) => ({
        code: (row[codeColumn] ?? "").trim(),
        quantity: (row[quantityColumn] ?? "").trim() || "1"
      }))
      .filter((r) => r.code.length > 0);
  }, [sourceMode, gridData, uploadPreview, hasHeader, codeColumn, quantityColumn]);

  const ambiguousItems = useMemo(
    () => planResponse?.items.filter((i) => i.requires_modal) ?? [],
    [planResponse]
  );
  const directItems = useMemo(
    () => planResponse?.items.filter((i) => !i.requires_modal) ?? [],
    [planResponse]
  );

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      try {
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
        setUploadPreview(rows.map((row) => row.map((cell) => String(cell))));
      } catch {
        setPlanError("فایل قابل خواندن نیست.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleCallPlan() {
    setPlanError(null);
    const rowCodes = extractedRows.map((r) => r.code);
    if (rowCodes.length === 0) {
      setPlanError("حداقل یک کد ردیف وارد کنید.");
      return;
    }

    try {
      const result = await callExcelPlan({
        documentId: document.id,
        body: { row_codes: rowCodes }
      }).unwrap();
      setPlanResponse(result);
      setAmbiguityIndex(0);
      setResolvedLines(new Map());

      if (result.items.some((i) => i.requires_modal)) {
        setStep("ambiguities");
      } else {
        buildReviewLines(result.items, new Map(), rowCodes);
        setStep("review");
      }
    } catch (error) {
      setPlanError(getApiErrorMessage(error));
    }
  }

  function buildReviewLines(
    items: ExcelPlanItem[],
    resolved: Map<number, FinancialDocumentLineCreateRequest>,
    rowCodes: string[]
  ) {
    const lines: ReviewLine[] = items.map((item) => {
      const existingPayload = resolved.get(item.pricebook_item_id);
      const matchedRow = extractedRows.find((r) =>
        item.row_codes.includes(r.code)
      );
      const quantity = matchedRow?.quantity ?? "1";

      const payload: FinancialDocumentLineCreateRequest = existingPayload ?? {
        pricebook_item_id: item.pricebook_item_id,
        quantity,
        ...(item.pricebook_row_id !== null
          ? { pricebook_row_id: item.pricebook_row_id }
          : {})
      };

      return { planItem: item, payload, error: null };
    });

    // Add unmatched as a notice — skip, the review will only show matched items
    void rowCodes;
    setReviewLines(lines);
  }

  function handleAmbiguityResolved(payload: FinancialDocumentLineCreateRequest) {
    const item = ambiguousItems[ambiguityIndex];
    if (!item) return;

    const next = new Map(resolvedLines);
    next.set(item.pricebook_item_id, payload);
    setResolvedLines(next);

    if (ambiguityIndex < ambiguousItems.length - 1) {
      setAmbiguityIndex(ambiguityIndex + 1);
    } else {
      // All ambiguities resolved — build review
      const allItems = [...directItems, ...ambiguousItems];
      buildReviewLines(allItems, next, extractedRows.map((r) => r.code));
      setStep("review");
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    try {
      const result = await createLinesBulk({
        documentId: document.id,
        body: { lines: reviewLines.map((l) => l.payload) }
      }).unwrap();
      onDocumentUpdated(result);
      onClose();
    } catch (error) {
      if (isInsufficientTokenBalance(error)) {
        setSubmitError(formatInsufficientBalanceMessage(error.data));
        return;
      }
      setSubmitError(getApiErrorMessage(error));
    }
  }

  const previewData =
    sourceMode === "file" && uploadPreview.length > 0
      ? uploadPreview.slice(0, 8)
      : null;

  const stepTitles: Record<WizardStep, string> = {
    source: "ورود کدهای ردیف",
    ambiguities: `تعیین تکلیف آیتم‌ها (${ambiguityIndex + 1} از ${ambiguousItems.length})`,
    review: "بررسی و افزودن"
  };

  return (
    <div
      className={classNames(
        "fixed inset-0 z-[100] flex items-end justify-center overflow-hidden bg-ui-overlay backdrop-blur-sm sm:items-start sm:p-4 sm:pt-10",
        secondaryNav ? "lg:right-[19rem]" : "lg:right-20"
      )}
      dir="rtl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-[calc(100dvh-0.75rem)] max-h-[calc(100dvh-0.75rem)] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-ui-border-subtle bg-ui-surface shadow-ui sm:h-auto sm:max-h-[90dvh] sm:rounded-lg sm:border-b"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-ui-border-subtle bg-ui-surface p-3 sm:gap-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-white sm:text-lg">
              افزودن از اکسل
            </h2>
            <p className="mt-0.5 truncate text-xs text-ui-text-muted">
              {stepTitles[step]}
            </p>
          </div>
          <button
            aria-label="بستن"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary sm:h-9 sm:w-9"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 [scrollbar-color:rgba(96,165,250,0.45)_rgba(15,23,42,0.25)] [scrollbar-width:thin]">
          {/* ── Step: Source ─────────────────────────────────────────────── */}
          {step === "source" ? (
            <div className="min-w-0 space-y-4 sm:space-y-5">
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  className={classNames(
                    "flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold transition sm:px-4",
                    sourceMode === "spreadsheet"
                      ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
                      : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:bg-ui-surface-subtle"
                  )}
                  onClick={() => setSourceMode("spreadsheet")}
                  type="button"
                >
                  جدول مستقیم
                </button>
                <button
                  className={classNames(
                    "flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold transition sm:px-4",
                    sourceMode === "file"
                      ? "border-ui-primary/40 bg-ui-primary-soft text-ui-primary"
                      : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:bg-ui-surface-subtle"
                  )}
                  onClick={() => setSourceMode("file")}
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  آپلود فایل
                </button>
              </div>

              {sourceMode === "spreadsheet" ? (
                <div className="min-w-0 space-y-2">
                  <p className="text-xs text-ui-text-muted">
                    کدهای ردیف را در ستون اول و مقادیر را (اختیاری) در ستون دوم وارد کنید. از
                    اکسل می‌توانید Ctrl+V بزنید.
                  </p>
                  <div className="max-h-[46dvh] max-w-full overflow-auto overscroll-contain rounded-lg sm:max-h-[50dvh] [scrollbar-width:thin]">
                    <MiniSpreadsheet
                      headers={["کد ردیف", "مقدار"]}
                      onChange={setGridData}
                      value={gridData}
                    />
                  </div>
                </div>
              ) : (
                <div className="min-w-0 space-y-3">
                  <input
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    type="file"
                  />
                  <button
                    className="flex min-h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ui-border-default px-3 py-6 text-sm text-ui-text-secondary transition hover:border-ui-primary/40 hover:text-ui-primary sm:py-8"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Upload className="h-5 w-5" />
                    انتخاب فایل اکسل یا CSV
                  </button>

                  {previewData ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-ui-text-muted">
                        پیش‌نمایش فایل ({uploadPreview.length} ردیف)
                      </p>
                      <div className="max-h-48 max-w-full overflow-auto overscroll-contain rounded-lg border border-ui-border-subtle" dir="ltr">
                        <table className="min-w-max text-xs">
                          <tbody>
                            {previewData.map((row, r) => (
                              <tr
                                className={r === 0 ? "bg-slate-800/60 " : ""}
                                key={r}
                              >
                                {row.slice(0, 6).map((cell, c) => (
                                  <td
                                    className="max-w-48 truncate whitespace-nowrap border-b border-ui-border-subtle px-2 py-1.5 text-ui-text-secondary"
                                    key={c}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Column mapping */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="min-w-0 space-y-1.5">
                          <span className="text-xs font-bold text-ui-text-secondary">
                            ستون کد ردیف
                          </span>
                          <select
                            className={classNames(inputClasses, "text-sm")}
                            onChange={(e) => setCodeColumn(Number(e.target.value))}
                            value={codeColumn}
                          >
                            {(uploadPreview[0] ?? []).map((_, i) => (
                              <option key={i} value={i}>
                                ستون {i + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="min-w-0 space-y-1.5">
                          <span className="text-xs font-bold text-ui-text-secondary">
                            ستون مقدار
                          </span>
                          <select
                            className={classNames(inputClasses, "text-sm")}
                            onChange={(e) => setQuantityColumn(Number(e.target.value))}
                            value={quantityColumn}
                          >
                            {(uploadPreview[0] ?? []).map((_, i) => (
                              <option key={i} value={i}>
                                ستون {i + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ui-text-secondary">
                        <input
                          checked={hasHeader}
                          className="h-4 w-4 shrink-0 accent-ui-primary"
                          onChange={(e) => setHasHeader(e.target.checked)}
                          type="checkbox"
                        />
                        ردیف اول سرستون است (نادیده گرفته می‌شود)
                      </label>
                    </div>
                  ) : null}
                </div>
              )}

              {extractedRows.length > 0 ? (
                <p className="text-xs text-ui-text-muted">
                  {extractedRows.length} کد ردیف شناسایی شد.
                </p>
              ) : null}

              {planError ? (
                <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm text-rose-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {planError}
                </div>
              ) : null}

              <div className="sticky bottom-0 z-10 -mx-3 -mb-3 flex justify-start border-t border-ui-border-subtle bg-ui-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:p-0">
                <button
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ui-primary px-5 py-2.5 text-sm font-bold text-ui-primary-foreground transition hover:bg-ui-primary-hover disabled:opacity-50 sm:w-auto"
                  disabled={extractedRows.length === 0 || excelPlanState.isLoading}
                  onClick={() => void handleCallPlan()}
                  type="button"
                >
                  {excelPlanState.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                  بررسی کدها
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Step: Ambiguities ─────────────────────────────────────────── */}
          {step === "ambiguities" ? (
            <div className="min-w-0 space-y-4 sm:space-y-5">
              <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3 text-sm leading-6 text-amber-100">
                {ambiguousItems.length} آیتم نیاز به تعیین تکلیف دارند. برای هر کدام گزینه
                مناسب را انتخاب کنید.
              </div>

              {ambiguousItems[ambiguityIndex] ? (
                <AmbiguityCard
                  item={ambiguousItems[ambiguityIndex]}
                  key={ambiguityIndex}
                  onResolved={handleAmbiguityResolved}
                  quantityHint={
                    extractedRows.find((r) =>
                      ambiguousItems[ambiguityIndex].row_codes.includes(r.code)
                    )?.quantity ?? "1"
                  }
                />
              ) : null}

              {planResponse?.unmatched && planResponse.unmatched.length > 0 ? (
                <GlassCard className="p-3">
                  <p className="text-xs font-bold text-rose-300">
                    کدهای یافت‌نشده:
                  </p>
                  <p className="mt-1 break-all font-mono text-xs leading-6 text-ui-text-muted">
                    {planResponse.unmatched.join("، ")}
                  </p>
                </GlassCard>
              ) : null}

              <button
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-secondary"
                onClick={() => setStep("source")}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
                بازگشت
              </button>
            </div>
          ) : null}

          {/* ── Step: Review ─────────────────────────────────────────────── */}
          {step === "review" ? (
            <div className="min-w-0 space-y-4 sm:space-y-5">
              {planResponse?.unmatched && planResponse.unmatched.length > 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-400/8 p-3 text-sm text-amber-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    {planResponse.unmatched.length} کد یافت نشد:{" "}
                    <span className="font-mono">{planResponse.unmatched.join("، ")}</span>
                  </span>
                </div>
              ) : null}

              <ReviewStep
                isSubmitting={createLinesBulkState.isLoading}
                lines={reviewLines}
                onLinesChange={setReviewLines}
                onSubmit={() => void handleSubmit()}
                submitClassName="sticky bottom-0 z-10 shadow-xl shadow-slate-950/40 sm:static sm:shadow-none"
                submitError={submitError}
              />

              <button
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-secondary"
                onClick={() =>
                  setStep(ambiguousItems.length > 0 ? "ambiguities" : "source")
                }
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
                بازگشت
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
