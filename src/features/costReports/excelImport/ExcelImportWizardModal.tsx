import { useCallback, useMemo, useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import type { FinancialDocument, FinancialDocumentLineCreateRequest } from "../../financialDocuments/financialDocumentApi";
import {
  useFinancialDocumentExcelPlanMutation,
  useCreateFinancialDocumentLinesBulkMutation,
  type ExcelPlanItem,
  type ExcelPlanResponse
} from "../../financialDocuments/financialDocumentApi";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { isPositiveDecimal, normalizeQuantityValue } from "../costReportUtils";
import { inputClasses } from "../constants";
import { MiniSpreadsheet } from "./MiniSpreadsheet";
import { AmbiguityStep } from "./AmbiguityStep";
import { ReviewStep } from "./ReviewStep";
import type { ExtractedRow, ReviewLine, WizardImportStep } from "./wizardTypes";

type SourceMode = "grid" | "upload";
type ValueType = "quantity" | "unit_price";

function makeDefaultGrid(): string[][] {
  return Array.from({ length: 25 }, (_, i) =>
    i === 0 ? ["کد ردیف", "مقدار", "توضیح"] : ["", "", ""]
  );
}

function getNonEmptyColumns(grid: string[][]): Array<{ idx: number; sample: string }> {
  if (!grid.length) return [];
  const colCount = Math.max(...grid.map((r) => r.length));
  return Array.from({ length: colCount }, (_, c) => {
    const sample = grid.map((r) => r[c] ?? "").find((v) => v.trim()) ?? "";
    return { idx: c, sample };
  }).filter((col) => col.sample !== "");
}

function colLabel(idx: number): string {
  return String.fromCharCode(65 + idx);
}

export function ExcelImportWizardModal({
  coefficientSets,
  document,
  selectedCoefficientSetId,
  onSelectedCoefficientSetIdChange,
  onDocumentUpdated,
  onToast,
  onClose
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument;
  selectedCoefficientSetId: number | null;
  onSelectedCoefficientSetIdChange: (id: number | null) => void;
  onDocumentUpdated: (doc: FinancialDocument) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
  onClose: () => void;
}) {
  // ── step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardImportStep>("source");

  // ── source ───────────────────────────────────────────────────────────────
  const [sourceMode, setSourceMode] = useState<SourceMode>("grid");
  const [gridData, setGridData] = useState<string[][]>(makeDefaultGrid);
  const [uploadedGrid, setUploadedGrid] = useState<string[][] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── mapping ──────────────────────────────────────────────────────────────
  const [rowCodeCol, setRowCodeCol] = useState<number>(0);
  const [valueCol, setValueCol] = useState<number>(1);
  const [valueType, setValueType] = useState<ValueType>("quantity");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [mappingError, setMappingError] = useState<string | null>(null);

  // ── plan ─────────────────────────────────────────────────────────────────
  const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
  const [planResponse, setPlanResponse] = useState<ExcelPlanResponse | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [fetchPlan, planState] = useFinancialDocumentExcelPlanMutation();

  // ── ambiguities ──────────────────────────────────────────────────────────
  const [ambiguityIdx, setAmbiguityIdx] = useState(0);
  const [resolvedItems, setResolvedItems] = useState<Record<number, FinancialDocumentLineCreateRequest>>({});

  // ── footnotes ────────────────────────────────────────────────────────────
  const [footnoteSelections, setFootnoteSelections] = useState<Record<number, Record<string, boolean>>>({});
  const [footnoteIdx, setFootnoteIdx] = useState(0);

  // ── review ───────────────────────────────────────────────────────────────
  const [reviewLines, setReviewLines] = useState<ReviewLine[]>([]);
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createBulk, bulkState] = useCreateFinancialDocumentLinesBulkMutation();

  const activeGrid = sourceMode === "upload" ? (uploadedGrid ?? gridData) : gridData;

  // ── file upload ───────────────────────────────────────────────────────────
  async function handleFileDrop(file: File) {
    setUploadError(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
      const parsed: string[][] = (rawData as unknown[][]).map((row) =>
        (row as unknown[]).map((cell) => String(cell ?? ""))
      );
      setUploadedGrid(parsed);
    } catch {
      setUploadError("فایل قابل پردازش نیست. فرمت xlsx یا csv را بررسی کنید.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFileDrop(file);
  }

  // ── step transitions ─────────────────────────────────────────────────────
  async function handleMappingNext() {
    setMappingError(null);
    setPlanError(null);

    const grid = activeGrid;
    if (!grid.length) { setMappingError("داده‌ای برای پردازش وجود ندارد."); return; }

    const totalRows = grid.length;
    const startIdx = rangeStart.trim() ? Number(rangeStart) - 1 : 0;
    const endIdx = rangeEnd.trim() ? Number(rangeEnd) - 1 : totalRows - 1;

    if (isNaN(startIdx) || isNaN(endIdx) || startIdx < 0 || endIdx >= totalRows || startIdx > endIdx) {
      setMappingError("بازه ردیف‌ها معتبر نیست.");
      return;
    }

    const rows: ExtractedRow[] = [];
    for (let r = startIdx; r <= endIdx; r++) {
      const row = grid[r] ?? [];
      const code = (row[rowCodeCol] ?? "").trim();
      const val = (row[valueCol] ?? "").trim();
      if (code) rows.push({ row_code: code, value: val });
    }

    if (!rows.length) { setMappingError("هیچ ردیف معتبری در بازه انتخاب‌شده یافت نشد."); return; }

    setExtractedRows(rows);

    try {
      const plan = await fetchPlan({
        documentId: document.id,
        body: { row_codes: rows.map((r) => r.row_code) }
      }).unwrap();
      setPlanResponse(plan);
      setAmbiguityIdx(0);
      setResolvedItems({});
      setFootnoteSelections({});
      setFootnoteIdx(0);
      setStep("ambiguities");
    } catch (err) {
      setPlanError(getApiErrorMessage(err));
    }
  }

  const ambiguousItems = useMemo(
    () => planResponse?.items.filter((i) => i.requires_modal) ?? [],
    [planResponse]
  );
  const directItems = useMemo(
    () => planResponse?.items.filter((i) => !i.requires_modal) ?? [],
    [planResponse]
  );

  function handleAmbiguityResolved(planItem: ExcelPlanItem, payload: FinancialDocumentLineCreateRequest) {
    setResolvedItems((c) => ({ ...c, [planItem.pricebook_item_id]: payload }));
    if (ambiguityIdx + 1 < ambiguousItems.length) {
      setAmbiguityIdx((i) => i + 1);
    } else {
      goToFootnotes();
    }
  }

  function handleAmbiguitySkip() {
    if (ambiguityIdx + 1 < ambiguousItems.length) {
      setAmbiguityIdx((i) => i + 1);
    } else {
      goToFootnotes();
    }
  }

  const footnoteItems = directItems.filter(
    (item) => item.footnotes.length > 0 && !(item.pricebook_item_id in resolvedItems)
  );

  function goToFootnotes() {
    setFootnoteIdx(0);
    if (footnoteItems.length > 0) {
      setStep("footnotes");
    } else {
      buildReviewLines();
      setStep("review");
    }
  }

  function handleFootnoteNext() {
    if (footnoteIdx + 1 < footnoteItems.length) {
      setFootnoteIdx((i) => i + 1);
    } else {
      buildReviewLines();
      setStep("review");
    }
  }

  const buildReviewLines = useCallback(() => {
    if (!planResponse) return;
    const lines: ReviewLine[] = [];
    let planItemIdx = 0;

    for (const item of directItems) {
      const extractedRow = extractedRows.find((r) => item.row_codes.includes(r.row_code));
      const rawValue = extractedRow?.value ?? "";
      const normalizedValue = normalizeQuantityValue(rawValue);
      const footnotes = footnoteSelections[item.pricebook_item_id] ?? {};

      lines.push({
        planItemIdx: planItemIdx++,
        pricebook_item_id: item.pricebook_item_id,
        pricebook_row_id: item.pricebook_row_id,
        description_fa: item.description_fa,
        unit_fa: item.unit_fa,
        quantity: valueType === "quantity" ? normalizedValue || "1" : "1",
        manual_unit_price: valueType === "unit_price" ? normalizedValue : "",
        footnotes,
        isResolved: false
      });
    }

    for (const [itemIdStr, payload] of Object.entries(resolvedItems)) {
      const planItem = ambiguousItems.find((i) => i.pricebook_item_id === Number(itemIdStr));
      lines.push({
        planItemIdx: planItemIdx++,
        pricebook_item_id: Number(itemIdStr),
        pricebook_row_id: null,
        description_fa: planItem?.description_fa ?? "",
        unit_fa: planItem?.unit_fa ?? "",
        quantity: payload.quantity,
        manual_unit_price: payload.manual_unit_price ?? "",
        footnotes: (payload.footnotes as Record<string, boolean>) ?? {},
        isResolved: true
      });
    }

    setReviewLines(lines);
    setLineErrors({});
    setSubmitError(null);
  }, [planResponse, directItems, ambiguousItems, extractedRows, resolvedItems, footnoteSelections, valueType]);

  function handleReviewQuantityChange(idx: number, val: string) {
    setReviewLines((lines) =>
      lines.map((l) => (l.planItemIdx === idx ? { ...l, quantity: val } : l))
    );
  }

  function handleReviewManualPriceChange(idx: number, val: string) {
    setReviewLines((lines) =>
      lines.map((l) => (l.planItemIdx === idx ? { ...l, manual_unit_price: val } : l))
    );
  }

  async function handleBulkSubmit() {
    setSubmitError(null);
    setLineErrors({});

    const lineBodies: FinancialDocumentLineCreateRequest[] = reviewLines.map((line) => {
      if (line.isResolved) {
        const payload = resolvedItems[line.pricebook_item_id];
        return payload;
      }
      const body: FinancialDocumentLineCreateRequest = {
        pricebook_item_id: line.pricebook_item_id,
        quantity: normalizeQuantityValue(line.quantity) || "1"
      };
      if (line.pricebook_row_id) body.pricebook_row_id = line.pricebook_row_id;
      if (line.manual_unit_price) {
        const normalized = normalizeQuantityValue(line.manual_unit_price);
        if (isPositiveDecimal(normalized)) body.manual_unit_price = normalized;
      }
      if (Object.keys(line.footnotes).length > 0) body.footnotes = line.footnotes;
      return body;
    });

    try {
      const updatedDoc = await createBulk({
        documentId: document.id,
        body: { lines: lineBodies }
      }).unwrap();
      onDocumentUpdated(updatedDoc);
      onToast(`${reviewLines.length} ردیف با موفقیت اضافه شد.`, "success");
      onClose();
    } catch (err: unknown) {
      const errObj = err as { data?: unknown; status?: number };
      if (
        errObj?.data &&
        typeof errObj.data === "object" &&
        "errors" in (errObj.data as object)
      ) {
        const errs = (errObj.data as { errors: Record<string, unknown> }).errors;
        const mapped: Record<number, string> = {};
        for (const [idxStr, detail] of Object.entries(errs)) {
          const idx = Number(idxStr);
          mapped[idx] = typeof detail === "string" ? detail : JSON.stringify(detail);
        }
        setLineErrors(mapped);
        setSubmitError("برخی ردیف‌ها با خطا مواجه شدند. موارد مشخص‌شده را اصلاح کنید.");
      } else {
        setSubmitError(getApiErrorMessage(err));
      }
    }
  }

  // ── render helpers ────────────────────────────────────────────────────────
  const nonEmptyCols = getNonEmptyColumns(activeGrid);

  const stepTitles: Record<WizardImportStep, string> = {
    source: "منبع داده",
    mapping: "تنظیم ستون‌ها",
    ambiguities: "رفع ابهام",
    footnotes: "تبصره‌ها",
    review: "بازبینی و افزودن"
  };

  const steps: WizardImportStep[] = ["source", "mapping", "ambiguities", "footnotes", "review"];
  const stepIdx = steps.indexOf(step);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4"
      dir="rtl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/12 bg-slate-950/90 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/95">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 light:border-slate-200">
          <div>
            <h2 className="text-base font-black text-white light:text-slate-950">
              افزودن اکسل (قیمت‌ها/مقادیر)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
              {stepTitles[step]}
            </p>
          </div>
          <button
            aria-label="بستن"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200 light:hover:bg-slate-100 light:hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step progress */}
        <div className="shrink-0 flex gap-1 px-5 pt-3">
          {steps.map((s, i) => (
            <div
              className={[
                "h-1 flex-1 rounded-full transition",
                i < stepIdx
                  ? "bg-emerald-400"
                  : i === stepIdx
                    ? "bg-emerald-400/60"
                    : "bg-white/10 light:bg-slate-200"
              ].join(" ")}
              key={s}
            />
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* ── STEP: source ── */}
          {step === "source" ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  className={[
                    "flex-1 rounded-lg border px-4 py-2 text-sm font-bold transition",
                    sourceMode === "grid"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700"
                      : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 light:border-slate-200 light:text-slate-500 light:hover:text-slate-700"
                  ].join(" ")}
                  onClick={() => setSourceMode("grid")}
                  type="button"
                >
                  ورود دستی در صفحه‌گسترده
                </button>
                <button
                  className={[
                    "flex-1 rounded-lg border px-4 py-2 text-sm font-bold transition",
                    sourceMode === "upload"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700"
                      : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 light:border-slate-200 light:text-slate-500 light:hover:text-slate-700"
                  ].join(" ")}
                  onClick={() => setSourceMode("upload")}
                  type="button"
                >
                  بارگذاری فایل xlsx/csv
                </button>
              </div>

              {sourceMode === "grid" ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 light:text-slate-500">
                    کلیک برای انتخاب، دابل‌کلیک/تایپ برای ویرایش. Tab: ستون بعد، Enter: ردیف بعد، Ctrl+V: جای‌گذاری چندخانه.
                  </p>
                  <MiniSpreadsheet data={gridData} onChange={setGridData} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/4 px-6 py-10 text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/5 light:border-slate-300 light:bg-slate-50 light:hover:border-emerald-300 light:hover:bg-emerald-50"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="h-8 w-8 text-slate-400 light:text-slate-400" />
                    <p className="text-sm text-slate-300 light:text-slate-600">
                      فایل را اینجا رها کنید یا کلیک کنید
                    </p>
                    <p className="text-xs text-slate-500 light:text-slate-400">xlsx، xls، csv</p>
                    <input
                      accept=".xlsx,.xls,.csv"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileDrop(file);
                      }}
                      ref={fileInputRef}
                      type="file"
                    />
                  </div>
                  {uploadError ? (
                    <p className="flex items-center gap-2 text-sm text-rose-300 light:text-rose-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {uploadError}
                    </p>
                  ) : null}
                  {uploadedGrid ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-emerald-300 light:text-emerald-700">
                        <FileSpreadsheet className="h-4 w-4" />
                        فایل بارگذاری شد ({uploadedGrid.length} ردیف، {uploadedGrid[0]?.length ?? 0} ستون)
                      </div>
                      <div className="max-h-48 overflow-auto rounded-lg border border-white/10 text-xs light:border-slate-200">
                        <table className="min-w-full border-collapse" dir="ltr">
                          <tbody>
                            {uploadedGrid.slice(0, 8).map((row, r) => (
                              <tr key={r}>
                                {row.slice(0, 6).map((cell, c) => (
                                  <td
                                    className="border-b border-r border-white/10 px-2 py-1 text-slate-300 light:border-slate-200 light:text-slate-700"
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
                    </div>
                  ) : null}
                </div>
              )}

              <button
                className="w-full rounded-lg bg-emerald-500 py-3 text-base font-bold text-white shadow transition hover:bg-emerald-400 disabled:opacity-50 light:bg-emerald-600 light:hover:bg-emerald-500"
                disabled={sourceMode === "upload" && !uploadedGrid}
                onClick={() => setStep("mapping")}
                type="button"
              >
                بعدی: تنظیم ستون‌ها
              </button>
            </div>
          ) : null}

          {/* ── STEP: mapping ── */}
          {step === "mapping" ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                    ستون کد ردیف
                  </span>
                  <select
                    className={inputClasses}
                    onChange={(e) => setRowCodeCol(Number(e.target.value))}
                    value={rowCodeCol}
                  >
                    {nonEmptyCols.map((col) => (
                      <option key={col.idx} value={col.idx}>
                        {colLabel(col.idx)} — نمونه: {col.sample}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                    ستون مقدار/قیمت
                  </span>
                  <select
                    className={inputClasses}
                    onChange={(e) => setValueCol(Number(e.target.value))}
                    value={valueCol}
                  >
                    {nonEmptyCols.map((col) => (
                      <option key={col.idx} value={col.idx}>
                        {colLabel(col.idx)} — نمونه: {col.sample}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset>
                <legend className="text-sm font-bold text-slate-200 light:text-slate-700">
                  ستون مقدار چیست؟
                </legend>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 light:text-slate-600">
                    <input
                      checked={valueType === "quantity"}
                      className="accent-emerald-400"
                      onChange={() => setValueType("quantity")}
                      type="radio"
                    />
                    مقدار (quantity)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 light:text-slate-600">
                    <input
                      checked={valueType === "unit_price"}
                      className="accent-emerald-400"
                      onChange={() => setValueType("unit_price")}
                      type="radio"
                    />
                    قیمت واحد (unit price)
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                    ردیف شروع (شماره، خالی = اول)
                  </span>
                  <input
                    className={inputClasses}
                    dir="ltr"
                    min={1}
                    onChange={(e) => setRangeStart(e.target.value)}
                    placeholder="۱"
                    type="number"
                    value={rangeStart}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-200 light:text-slate-700">
                    ردیف پایان (شماره، خالی = آخر)
                  </span>
                  <input
                    className={inputClasses}
                    dir="ltr"
                    min={1}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    placeholder="آخرین ردیف"
                    type="number"
                    value={rangeEnd}
                  />
                </label>
              </div>

              {mappingError ? (
                <p className="flex items-center gap-2 text-sm text-rose-300 light:text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {mappingError}
                </p>
              ) : null}
              {planError ? (
                <p className="flex items-center gap-2 text-sm text-rose-300 light:text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {planError}
                </p>
              ) : null}
              {planResponse?.unmatched.length ? (
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 light:border-amber-300 light:bg-amber-50 light:text-amber-700">
                  <p className="font-bold">کدهای ناشناخته ({planResponse.unmatched.length}):</p>
                  <p className="mt-1 font-mono text-xs">{planResponse.unmatched.join("، ")}</p>
                  <p className="mt-1 text-xs">می‌توانید ادامه دهید؛ این ردیف‌ها نادیده گرفته می‌شوند.</p>
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/8 light:border-slate-200 light:text-slate-600 light:hover:bg-slate-50"
                  onClick={() => setStep("source")}
                  type="button"
                >
                  بازگشت
                </button>
                <button
                  className="flex-1 rounded-lg bg-emerald-500 py-3 text-base font-bold text-white shadow transition hover:bg-emerald-400 disabled:opacity-50 light:bg-emerald-600 light:hover:bg-emerald-500"
                  disabled={planState.isLoading}
                  onClick={() => void handleMappingNext()}
                  type="button"
                >
                  {planState.isLoading ? "در حال بررسی..." : "تأیید و بررسی"}
                </button>
              </div>
            </div>
          ) : null}

          {/* ── STEP: ambiguities ── */}
          {step === "ambiguities" ? (
            <div>
              {ambiguousItems.length === 0 ? (
                <div className="space-y-4 py-6 text-center">
                  <p className="text-sm text-slate-300 light:text-slate-600">
                    هیچ آیتم ابهام‌آمیزی وجود ندارد.
                  </p>
                  <button
                    className="w-full rounded-lg bg-emerald-500 py-3 text-base font-bold text-white transition hover:bg-emerald-400 light:bg-emerald-600"
                    onClick={goToFootnotes}
                    type="button"
                  >
                    بعدی
                  </button>
                </div>
              ) : (
                <AmbiguityStep
                  coefficientSets={coefficientSets}
                  key={ambiguousItems[ambiguityIdx]?.pricebook_item_id}
                  onResolved={(payload) =>
                    handleAmbiguityResolved(ambiguousItems[ambiguityIdx], payload)
                  }
                  onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
                  onSkip={handleAmbiguitySkip}
                  planItem={ambiguousItems[ambiguityIdx]}
                  progress={`ابهام ${ambiguityIdx + 1} از ${ambiguousItems.length}`}
                  selectedCoefficientSetId={selectedCoefficientSetId}
                />
              )}
            </div>
          ) : null}

          {/* ── STEP: footnotes ── */}
          {step === "footnotes" ? (
            <div className="space-y-4">
              {footnoteItems.length === 0 || footnoteIdx >= footnoteItems.length ? (
                <p className="text-sm text-slate-300 light:text-slate-600">
                  هیچ تبصره‌ای برای تعیین وضعیت وجود ندارد.
                </p>
              ) : (
                (() => {
                  const fItem = footnoteItems[footnoteIdx];
                  const selected = footnoteSelections[fItem.pricebook_item_id] ?? {};
                  return (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 light:text-slate-500">
                          تبصره {footnoteIdx + 1} از {footnoteItems.length}
                        </p>
                        <h3 className="mt-1 text-base font-black text-white light:text-slate-950">
                          {fItem.description_fa}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {fItem.footnotes.map((note) => (
                          <label
                            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50"
                            key={note.id}
                          >
                            <input
                              checked={Boolean(selected[note.note_code])}
                              className="mt-1 h-4 w-4 accent-emerald-300"
                              onChange={(e) =>
                                setFootnoteSelections((prev) => ({
                                  ...prev,
                                  [fItem.pricebook_item_id]: {
                                    ...prev[fItem.pricebook_item_id],
                                    [note.note_code]: e.target.checked
                                  }
                                }))
                              }
                              type="checkbox"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-slate-100 light:text-slate-900">
                                {note.title_fa}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-400 light:text-slate-500 line-clamp-2">
                                {note.body_fa}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/8 light:border-slate-200 light:text-slate-600"
                  onClick={() => {
                    buildReviewLines();
                    setStep("review");
                  }}
                  type="button"
                >
                  رد کردن همه
                </button>
                <button
                  className="flex-1 rounded-lg bg-emerald-500 py-3 text-base font-bold text-white shadow transition hover:bg-emerald-400 light:bg-emerald-600"
                  onClick={handleFootnoteNext}
                  type="button"
                >
                  {footnoteIdx + 1 < footnoteItems.length ? "بعدی" : "ادامه به بازبینی"}
                </button>
              </div>
            </div>
          ) : null}

          {/* ── STEP: review ── */}
          {step === "review" ? (
            <ReviewStep
              isSubmitting={bulkState.isLoading}
              lineErrors={lineErrors}
              lines={reviewLines}
              onManualPriceChange={handleReviewManualPriceChange}
              onQuantityChange={handleReviewQuantityChange}
              onSubmit={() => void handleBulkSubmit()}
              submitError={submitError}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
