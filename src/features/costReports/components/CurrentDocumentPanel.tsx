import { useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X
} from "lucide-react";

import bNazaninFontUrl from "../../../assets/fonts/B-NAZANIN.TTF?url";
import type { FinancialDocument, FinancialDocumentLine } from "../../financialDocuments/financialDocumentApi";
import {
  useDeleteFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation,
  useUpdateFinancialDocumentLineMutation
} from "../../financialDocuments/financialDocumentApi";
import type { Project } from "../../projects/projectApi";
import { Button } from "../../../shared/components/Button";
import { GlassCard } from "../../../shared/components/GlassCard";
import { InfoBox } from "../../../shared/components/InfoBox";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { cleanDisplayText, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { inputClasses } from "../constants";
import type { DocumentTotals } from "../types";
import {
  getDocumentStatusLabel,
  getDocumentStatusTone,
  getDocumentTotals,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue
} from "../costReportUtils";

function escapeHtml(value: number | string | null | undefined, fallback = ""): string {
  return cleanDisplayText(value, fallback)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildOfficialFormHtml({
  document,
  project,
  selectedCoefficientSetName,
  selectedEditionYear,
  totals
}: {
  document: FinancialDocument;
  project: Project | null;
  selectedCoefficientSetName: string | null;
  selectedEditionYear: number | undefined;
  totals: DocumentTotals;
}): string {
  const projectName = escapeHtml(project?.name ?? document.title ?? "بدون نام");
  const contractNumber = escapeHtml(project?.contract_number ?? "—");
  const contractorName = escapeHtml(project?.contractor_name ?? "—");
  const employerName = escapeHtml(project?.employer_name ?? "—");
  const consultantName = escapeHtml(project?.consultant_name ?? "—");
  const documentDate = escapeHtml(document.document_date, "—");
  const editionYear = escapeHtml(selectedEditionYear ? String(selectedEditionYear) : "—");
  const coefficientName = escapeHtml(selectedCoefficientSetName ?? "بدون ضریب");
  const lines = document.lines ?? [];
  const chapterTotals = document.chapter_totals ?? [];
  const totalFinal = Number(totals.totalAmount ?? 0);

  // Chapter summary rows
  const chapterSummaryRows = chapterTotals
    .map((chapter) => {
      const finalAmt = Number(chapter.final_total_amount ?? 0);
      const weightPct =
        totalFinal > 0 ? `${((finalAmt / totalFinal) * 100).toFixed(1)}%` : "—";
      return `
        <tr>
          <td class="code">${escapeHtml(chapter.chapter_code_snapshot)}</td>
          <td class="desc">${escapeHtml(chapter.chapter_title_snapshot, "—")}</td>
          <td>${formatMoneyAmount(chapter.raw_total_amount)}</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>${formatMoneyAmount(chapter.final_total_amount)}</td>
          <td>${weightPct}</td>
        </tr>`;
    })
    .join("");

  // Per-chapter detail tables
  const chapterDetailBlocks = chapterTotals
    .map((chapter) => {
      const chapterLines = lines.filter((line) =>
        line.row_code_snapshot?.startsWith(chapter.chapter_code_snapshot)
      );
      const lineRows = chapterLines
        .map(
          (line) => `
        <tr>
          <td>${escapeHtml(line.line_no)}</td>
          <td class="code">${escapeHtml(line.row_code_snapshot)}</td>
          <td class="desc">${escapeHtml(line.description_snapshot, "شرح ثبت نشده")}</td>
          <td>${escapeHtml(line.unit_snapshot, "—")}</td>
          <td>${formatMoneyAmount(line.unit_price_snapshot)}</td>
          <td>${escapeHtml(line.quantity)}</td>
          <td>${formatMoneyAmount(line.total_amount_snapshot)}</td>
        </tr>`
        )
        .join("");

      return `
      <h3 class="chapter-title">
        برگه مالی صورت وضعیت قطعی (پیمانکار) — فصل ${escapeHtml(chapter.chapter_code_snapshot)}: ${escapeHtml(chapter.chapter_title_snapshot)}
      </h3>
      <table>
        <thead>
          <tr>
            <th>ردیف</th>
            <th>شماره</th>
            <th class="desc">شرح فهرست‌بها و ملاحظات</th>
            <th>واحد</th>
            <th>بهای واحد</th>
            <th>مقدار</th>
            <th>جمع (ریال)</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows || `<tr><td colspan="7" style="text-align:center">ردیفی برای این فصل یافت نشد.</td></tr>`}
          <tr class="subtotal">
            <td colspan="6" class="desc">جمع فصل پس از اعمال ضرایب</td>
            <td>${formatMoneyAmount(chapter.final_total_amount)}</td>
          </tr>
        </tbody>
      </table>`;
    })
    .join("");

  // Ungrouped lines (lines that didn't match any chapter)
  const ungroupedLines = lines.filter((line) => {
    return !chapterTotals.some((chapter) =>
      line.row_code_snapshot?.startsWith(chapter.chapter_code_snapshot)
    );
  });
  const ungroupedRows = ungroupedLines
    .map(
      (line) => `
      <tr>
        <td>${escapeHtml(line.line_no)}</td>
        <td class="code">${escapeHtml(line.row_code_snapshot)}</td>
        <td class="desc">${escapeHtml(line.description_snapshot, "شرح ثبت نشده")}</td>
        <td>${escapeHtml(line.unit_snapshot, "—")}</td>
        <td>${formatMoneyAmount(line.unit_price_snapshot)}</td>
        <td>${escapeHtml(line.quantity)}</td>
        <td>${formatMoneyAmount(line.total_amount_snapshot)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>صورت وضعیت قطعی — ${projectName}</title>
    <style>
      @font-face {
        font-family: "B Nazanin";
        src: url("${bNazaninFontUrl}") format("truetype");
        font-weight: normal;
        font-style: normal;
      }
      @page { size: A4; margin: 14mm 12mm; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        background: #fff;
        color: #111827;
        direction: rtl;
        font-family: "B Nazanin", Vazirmatn, Tahoma, sans-serif;
        font-size: 13px;
        line-height: 1.8;
      }
      .form-header {
        border: 2px solid #111827;
        margin-bottom: 12px;
      }
      .form-header-top {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid #111827;
      }
      .form-header-cell {
        flex: 1;
        padding: 6px 10px;
        border-left: 1px solid #111827;
        font-size: 12px;
      }
      .form-header-cell:last-child { border-left: none; }
      .form-header-cell span { display: block; color: #6b7280; font-size: 11px; }
      .form-header-cell strong { display: block; }
      .form-title {
        text-align: center;
        padding: 8px;
        font-size: 16px;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0 18px;
        page-break-inside: auto;
      }
      tr { page-break-inside: avoid; }
      th, td {
        border: 1px solid #6b7280;
        padding: 5px 6px;
        text-align: center;
        vertical-align: middle;
        font-size: 12px;
      }
      th { background: #f3f4f6; font-weight: 700; }
      td.desc { text-align: right; }
      td.code { direction: ltr; font-family: Consolas, "Courier New", monospace; font-size: 11px; }
      th.desc { text-align: right; }
      tr.subtotal td { background: #f3f4f6; font-weight: 700; }
      .chapter-title {
        font-size: 13px;
        font-weight: 700;
        margin: 18px 0 6px;
        border-bottom: 1px solid #374151;
        padding-bottom: 4px;
      }
      .totals-table { max-width: 460px; min-width: 300px; margin: 24px auto 0; }
      .signatures {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-top: 32px;
      }
      .signature {
        border: 1px solid #6b7280;
        min-height: 64px;
        padding: 8px;
        text-align: center;
        font-size: 12px;
      }
      .signature-title { font-weight: 700; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 4px; }
      @media print { .no-print { display: none !important; } }
    </style>
  </head>
  <body>
    <div class="form-header">
      <div class="form-title">صورت وضعیت قطعی پیمانکار</div>
      <div class="form-header-top">
        <div class="form-header-cell">
          <span>نام پروژه</span>
          <strong>${projectName}</strong>
        </div>
        <div class="form-header-cell">
          <span>شماره پیمان</span>
          <strong>${contractNumber}</strong>
        </div>
        <div class="form-header-cell">
          <span>تاریخ</span>
          <strong>${documentDate}</strong>
        </div>
        <div class="form-header-cell">
          <span>سال فهرست‌بها</span>
          <strong>${editionYear}</strong>
        </div>
        <div class="form-header-cell">
          <span>ضریب فعال</span>
          <strong>${coefficientName}</strong>
        </div>
      </div>
    </div>

    ${
      chapterTotals.length > 0
        ? `<h3 class="chapter-title">خلاصه مالی فصول</h3>
           <table>
             <thead>
               <tr>
                 <th>فصل</th>
                 <th class="desc">شرح فصول</th>
                 <th>فهرست بها</th>
                 <th>ستاره‌دار</th>
                 <th>فاکتوری</th>
                 <th>مصالح پای‌کار</th>
                 <th>جمع فصل</th>
                 <th>% وزنی</th>
               </tr>
             </thead>
             <tbody>
               ${chapterSummaryRows}
               <tr class="subtotal">
                 <td colspan="6" class="desc">جمع کل</td>
                 <td>${formatMoneyAmount(totals.totalAmount)}</td>
                 <td>100%</td>
               </tr>
             </tbody>
           </table>`
        : ""
    }

    ${chapterDetailBlocks}

    ${
      ungroupedRows
        ? `<h3 class="chapter-title">ردیف‌های سایر فصول</h3>
           <table>
             <thead>
               <tr>
                 <th>ردیف</th>
                 <th>شماره</th>
                 <th class="desc">شرح فهرست‌بها و ملاحظات</th>
                 <th>واحد</th>
                 <th>بهای واحد</th>
                 <th>مقدار</th>
                 <th>جمع (ریال)</th>
               </tr>
             </thead>
             <tbody>
               ${ungroupedRows}
             </tbody>
           </table>`
        : ""
    }

    ${
      lines.length === 0
        ? `<p style="text-align:center;padding:20px;color:#6b7280">هنوز ردیفی به این صورت‌بها اضافه نشده است.</p>`
        : ""
    }

    <div style="display:flex;justify-content:center;margin-top:24px;">
      <table class="totals-table">
        <tbody>
          <tr><th>جمع بهای فهرست</th><td>${formatMoneyAmount(totals.pricebookAmount)}</td></tr>
          <tr><th>جمع ضرایب</th><td>${formatMoneyAmount(totals.coefficientAmount)}</td></tr>
          <tr class="subtotal"><th>جمع کل</th><td>${formatMoneyAmount(totals.totalAmount)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div class="signature">
        <div class="signature-title">پیمانکار</div>
        ${contractorName}
      </div>
      <div class="signature">
        <div class="signature-title">مشاور</div>
        ${consultantName}
      </div>
      <div class="signature">
        <div class="signature-title">کارفرما</div>
        ${employerName}
      </div>
      <div class="signature">
        <div class="signature-title">بهره‌بردار</div>
      </div>
    </div>
  </body>
</html>`;
}

export function CurrentDocumentPanel({
  document,
  onDocumentUpdated,
  project,
  selectedCoefficientSetName,
  selectedEditionYear,
  setupNotice
}: {
  document: FinancialDocument | null;
  onDocumentUpdated: (document: FinancialDocument) => void;
  project: Project | null;
  selectedCoefficientSetName: string | null;
  selectedEditionYear: number | undefined;
  setupNotice: string | null;
}) {
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isBrowserPdfPreparing, setIsBrowserPdfPreparing] = useState(false);
  const [recalculateDocument, recalculateState] = useRecalculateFinancialDocumentMutation();
  const [updateLine, updateLineState] = useUpdateFinancialDocumentLineMutation();
  const [deleteLine, deleteLineState] = useDeleteFinancialDocumentLineMutation();
  const lines = document?.lines ?? [];
  const totals = getDocumentTotals(document);
  const isLocked = isFinancialDocumentLocked(document);
  const isActionBusy =
    recalculateState.isLoading ||
    updateLineState.isLoading ||
    deleteLineState.isLoading ||
    isBrowserPdfPreparing;

  function startEditingLine(line: FinancialDocumentLine) {
    setActionError(null);
    setActionSuccess(null);
    setEditingLineId(line.id);
    setEditingQuantity(line.quantity);
  }

  async function handleSaveLine(line: FinancialDocumentLine) {
    if (!document || isLocked) {
      setActionError("این صورت‌بها قفل شده و قابل ویرایش نیست.");
      return;
    }

    const normalizedQuantity = normalizeQuantityValue(editingQuantity);
    if (!isPositiveDecimal(normalizedQuantity)) {
      setActionError("مقدار خط باید یک عدد مثبت باشد.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await updateLine({
        documentId: document.id,
        lineId: line.id,
        body: { quantity: normalizedQuantity }
      }).unwrap();
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setEditingLineId(null);
      setEditingQuantity("");
      setActionSuccess("مقدار خط به‌روزرسانی شد.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleDeleteLine(line: FinancialDocumentLine) {
    if (!document || isLocked) {
      setActionError("این صورت‌بها قفل شده و قابل ویرایش نیست.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteLine({ documentId: document.id, lineId: line.id }).unwrap();
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setActionSuccess("خط از صورت‌بها حذف شد.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  function handleTogglePreview() {
    if (previewHtml) {
      setPreviewHtml(null);
      return;
    }

    if (!document) {
      setActionError("ابتدا سند صورت‌بها را بسازید.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setPreviewHtml(
      buildOfficialFormHtml({
        document,
        project,
        selectedCoefficientSetName,
        selectedEditionYear,
        totals
      })
    );
  }

  function handleBrowserPdfDownload() {
    if (!document) {
      setActionError("ابتدا سند صورت‌بها را بسازید.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setIsBrowserPdfPreparing(true);

    try {
      const printWindow = window.open("", "_blank", "width=1024,height=768");

      if (!printWindow) {
        setActionError(
          "مرورگر پنجره چاپ را مسدود کرد. اجازه pop-up را برای این سایت فعال کنید."
        );
        setIsBrowserPdfPreparing(false);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(
        buildOfficialFormHtml({
          document,
          project,
          selectedCoefficientSetName,
          selectedEditionYear,
          totals
        })
      );
      printWindow.document.close();

      printWindow.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setActionSuccess("پنجره چاپ باز شد. برای ذخیره به PDF گزینه «ذخیره به صورت PDF» را انتخاب کنید.");
        setIsBrowserPdfPreparing(false);
      }, 350);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "ساخت PDF در مرورگر ناموفق بود."
      );
      setIsBrowserPdfPreparing(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">صورت‌بهای جاری</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            خطوطی که از محاسبه آیتم‌ها به سند اضافه می‌شوند، اینجا نمایش داده می‌شوند.
          </p>
        </div>
        {document ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-12 text-base font-bold"
              data-tour="preview-btn"
              disabled={isActionBusy}
              onClick={handleTogglePreview}
              type="button"
              variant={previewHtml ? "secondary" : "primary"}
            >
              {previewHtml ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              {previewHtml ? "بستن پیش‌نمایش" : "پیش‌نمایش صورت‌بها"}
            </Button>
            <Button
              className="h-12 text-base font-bold"
              disabled={isActionBusy}
              onClick={handleBrowserPdfDownload}
              type="button"
            >
              {isBrowserPdfPreparing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              خروجی گرفتن
            </Button>
            <StatusBadge tone={getDocumentStatusTone(document.status)}>
              {`${getDocumentStatusLabel(document.status)} - ${totals.lineCount} خط`}
            </StatusBadge>
          </div>
        ) : (
          <StatusBadge tone="amber">سند ساخته نشده</StatusBadge>
        )}
      </div>

      {!document ? (
        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
          {setupNotice ?? "ابتدا پروژه و صورت‌بها را ثبت کنید تا بتوانید ردیف اضافه کنید."}
        </div>
      ) : null}

      {document ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoBox
              label="عنوان سند"
              value={cleanDisplayText(document.title, "صورت‌بهای بدون عنوان")}
            />
            <InfoBox label="شماره سند" value={cleanDisplayText(document.document_number, "—")} />
            <InfoBox
              label="سال فهرست‌بها"
              value={selectedEditionYear ? String(selectedEditionYear) : "—"}
            />
            <InfoBox label="ضریب فعال" value={selectedCoefficientSetName ?? "بدون ضریب"} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <InfoBox label="جمع فهرست‌بها" value={formatMoneyAmount(totals.pricebookAmount)} />
            <InfoBox label="جمع ضرایب" value={formatMoneyAmount(totals.coefficientAmount)} />
            <InfoBox label="جمع کل" value={formatMoneyAmount(totals.totalAmount)} />
          </div>

          {isLocked ? (
            <p className="text-xs leading-6 text-violet-100 light:text-violet-800">
              سند قفل شده است؛ ویرایش، حذف و افزودن خط غیرفعال شده‌اند.
            </p>
          ) : null}

          {actionSuccess ? (
            <p className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm leading-7 text-emerald-100 light:text-emerald-800">
              {actionSuccess}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              {actionError}
            </p>
          ) : null}

          {previewHtml ? (
            <section className="overflow-hidden rounded-lg border border-emerald-300/20">
              <iframe
                className="h-[75vh] w-full bg-white"
                sandbox=""
                srcDoc={previewHtml}
                title="پیش‌نمایش صورت وضعیت"
              />
            </section>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-white/10 light:border-slate-200">
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                <div className="grid grid-cols-[70px_110px_1fr_130px_90px_130px_130px_130px_130px_80px] gap-3 bg-white/7 px-4 py-3 text-xs font-bold text-slate-300 light:bg-slate-50 light:text-slate-600">
                  <span>ردیف</span>
                  <span>کد</span>
                  <span>شرح</span>
                  <span>مقدار</span>
                  <span>واحد</span>
                  <span>بهای واحد</span>
                  <span>مبلغ پایه</span>
                  <span>مبلغ ضرایب</span>
                  <span>مبلغ کل</span>
                  <span></span>
                </div>
                {lines.length === 0 ? (
                  <div className="px-4 py-5 text-center text-sm text-slate-400 light:text-slate-500">
                    هنوز خطی به صورت‌بها اضافه نشده است.
                  </div>
                ) : null}
                <div className="max-h-[36vh] overflow-y-auto [scrollbar-color:rgba(16,185,129,0.55)_rgba(15,23,42,0.25)] [scrollbar-width:thin]" data-tour="finalize-rows">
                  {lines.map((line: FinancialDocumentLine) => (
                    <div
                      className="grid grid-cols-[70px_110px_1fr_130px_90px_130px_130px_130px_130px_80px] gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-200 light:border-slate-200 light:text-slate-700"
                      key={line.id}
                    >
                      <span>{line.line_no}</span>
                      <span className="font-mono text-emerald-200 light:text-emerald-700">
                        {line.row_code_snapshot}
                      </span>
                      <span
                        className="truncate"
                        title={cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                      >
                        {cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                      </span>
                      <span>
                        {editingLineId === line.id ? (
                          <input
                            className={classNames(inputClasses, "h-9 text-left")}
                            dir="ltr"
                            inputMode="decimal"
                            onChange={(event) => setEditingQuantity(event.target.value)}
                            value={editingQuantity}
                          />
                        ) : (
                          line.quantity
                        )}
                      </span>
                      <span>{cleanDisplayText(line.unit_snapshot, "—")}</span>
                      <span>{formatMoneyAmount(line.unit_price_snapshot)}</span>
                      <span>{formatMoneyAmount(line.base_amount_snapshot)}</span>
                      <span>{formatMoneyAmount(line.coefficient_amount_snapshot)}</span>
                      <span className="font-bold text-slate-100 light:text-slate-900">
                        {formatMoneyAmount(line.total_amount_snapshot)}
                      </span>
                      <div className="flex items-center gap-1">
                        {editingLineId === line.id ? (
                          <>
                            <button
                              aria-label="ذخیره مقدار"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-45 light:text-emerald-700"
                              disabled={isActionBusy || isLocked}
                              onClick={() => void handleSaveLine(line)}
                              title="ذخیره"
                              type="button"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            <button
                              aria-label="انصراف"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-slate-300 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45 light:border-slate-200 light:bg-white light:text-slate-600"
                              disabled={isActionBusy}
                              onClick={() => {
                                setEditingLineId(null);
                                setEditingQuantity("");
                              }}
                              title="انصراف"
                              type="button"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              aria-label="ویرایش مقدار"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={isActionBusy || isLocked}
                              onClick={() => startEditingLine(line)}
                              title="ویرایش مقدار"
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              aria-label="حذف خط"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={isActionBusy || isLocked}
                              onClick={() => void handleDeleteLine(line)}
                              title="حذف خط"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {document.chapter_totals.length > 0 ? (
            <details className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
              <summary className="cursor-pointer text-sm font-black text-white light:text-slate-950">
                جمع فصل‌ها
              </summary>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {document.chapter_totals.map((chapterTotal) => (
                  <div
                    className="rounded-lg border border-white/10 bg-slate-950/35 p-3 text-sm light:border-slate-200 light:bg-white"
                    key={chapterTotal.id}
                  >
                    <p className="font-bold text-slate-100 light:text-slate-900">
                      {chapterTotal.chapter_code_snapshot} -{" "}
                      {chapterTotal.chapter_title_snapshot}
                    </p>
                    <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
                      جمع نهایی: {formatMoneyAmount(chapterTotal.final_total_amount)}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}
