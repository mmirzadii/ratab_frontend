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
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

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
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { inputClasses } from "../constants";
import type { DocumentTotals } from "../types";
import {
  getDocumentStatusLabel,
  getDocumentStatusTone,
  getDocumentTotals,
  getLineDisplayRows,
  hasPositiveMoneyValue,
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

function toJalali(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  try {
    return new DateObject({
      date: isoDate,
      format: "YYYY-MM-DD",
      calendar: gregorian,
      locale: gregorian_en
    })
      .convert(persian, persian_fa)
      .format("YYYY/MM/DD");
  } catch {
    return isoDate;
  }
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
  const documentDate = escapeHtml(toJalali(document.document_date));
  const editionYear = escapeHtml(selectedEditionYear ? String(selectedEditionYear) : "—");
  const coefficientName = escapeHtml(selectedCoefficientSetName ?? "بدون ضریب");
  const lines = document.lines ?? [];
  const displayRows = lines.flatMap((line) => getLineDisplayRows(line));
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
      const chapterRows = displayRows.filter((row) =>
        row.rowCode?.startsWith(chapter.chapter_code_snapshot)
      );
      const lineRows = chapterRows
        .map(
          (row) => `
        <tr>
          <td>${escapeHtml(row.parentLineNo)}</td>
          <td class="code">${escapeHtml(row.rowCode)}</td>
          <td class="desc">${escapeHtml(row.title, "شرح ثبت نشده")}</td>
          <td>${escapeHtml(row.unit, "—")}</td>
          <td>${row.isStarredPrice ? "★ ستاره‌دار<br>" : ""}${hasPositiveMoneyValue(row.unitPrice) ? formatMoneyAmount(row.unitPrice) : "-"}</td>
          <td>${escapeHtml(formatDecimal(row.quantity))}</td>
          <td>${formatMoneyAmount(row.total)}</td>
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
  const ungroupedDisplayRows = displayRows.filter((row) => {
    return !chapterTotals.some((chapter) =>
      row.rowCode?.startsWith(chapter.chapter_code_snapshot)
    );
  });
  const ungroupedRows = ungroupedDisplayRows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.parentLineNo)}</td>
        <td class="code">${escapeHtml(row.rowCode)}</td>
        <td class="desc">${escapeHtml(row.title, "شرح ثبت نشده")}</td>
        <td>${escapeHtml(row.unit, "—")}</td>
        <td>${row.isStarredPrice ? "★ ستاره‌دار<br>" : ""}${hasPositiveMoneyValue(row.unitPrice) ? formatMoneyAmount(row.unitPrice) : "-"}</td>
        <td>${escapeHtml(formatDecimal(row.quantity))}</td>
        <td>${formatMoneyAmount(row.total)}</td>
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
 font-family:"B Nazanin", Vazirmatn, Tahoma, sans-serif;
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
 td.code { direction: ltr; font-family: Consolas,"Courier New", monospace; font-size: 11px; }
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

  function renderLineActions(line: FinancialDocumentLine) {
    const isEditing = editingLineId === line.id;

    return (
      <div className="flex shrink-0 items-center gap-1">
        {isEditing ? (
          <>
            <button
              aria-label="ذخیره مقدار"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-ui-primary/25 bg-ui-primary-soft text-ui-primary transition hover:bg-ui-surface-selected disabled:cursor-not-allowed disabled:opacity-45 sm:h-8 sm:w-8"
              disabled={isActionBusy || isLocked}
              onClick={() => void handleSaveLine(line)}
              title="ذخیره"
              type="button"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="انصراف"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary transition hover:bg-ui-surface-hover disabled:cursor-not-allowed disabled:opacity-45 sm:h-8 sm:w-8"
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
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-transparent p-1.5 text-ui-text-muted transition hover:bg-ui-primary-soft hover:text-ui-primary disabled:cursor-not-allowed disabled:opacity-45 sm:h-8 sm:w-8"
              disabled={isActionBusy || isLocked}
              onClick={() => startEditingLine(line)}
              title="ویرایش مقدار"
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              aria-label="حذف خط"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-transparent p-1.5 text-ui-text-muted transition hover:bg-ui-danger-soft hover:text-ui-danger disabled:cursor-not-allowed disabled:opacity-45 sm:h-8 sm:w-8"
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
    );
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
    <GlassCard className="flex max-h-[calc(100dvh-8.5rem)] min-h-0 flex-col overflow-hidden p-3 sm:block sm:max-h-none sm:overflow-visible sm:p-5">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-lg font-black text-ui-text-primary">صورت‌بهای جاری</h2>
          <p className="mt-2 hidden text-sm leading-7 text-ui-text-secondary sm:block">
            خطوطی که از محاسبه آیتم‌ها به سند اضافه می‌شوند، اینجا نمایش داده می‌شوند.
          </p>
        </div>
        {document ? (
          <div className="sm:hidden">
            <StatusBadge tone={getDocumentStatusTone(document.status)}>
              {totals.lineCount} خط
            </StatusBadge>
          </div>
        ) : null}
        {document ? (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              className="h-11 px-2 text-xs font-bold sm:h-12 sm:px-4 sm:text-base"
              data-tour="preview-btn"
              disabled={isActionBusy}
              onClick={handleTogglePreview}
              type="button"
              variant={previewHtml ? "secondary" : "primary"}
            >
              {previewHtml ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              <span className="sm:hidden">{previewHtml ? "بستن پیش‌نمایش" : "پیش‌نمایش"}</span>
              <span className="hidden sm:inline">{previewHtml ? "بستن پیش‌نمایش" : "پیش‌نمایش صورت‌بها"}</span>
            </Button>
            <Button
              className="h-11 px-2 text-xs font-bold sm:h-12 sm:px-4 sm:text-base"
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
            <div className="hidden sm:block">
              <StatusBadge tone={getDocumentStatusTone(document.status)}>
                {`${getDocumentStatusLabel(document.status)} - ${totals.lineCount} خط`}
              </StatusBadge>
            </div>
          </div>
        ) : (
          <StatusBadge tone="amber">سند ساخته نشده</StatusBadge>
        )}
      </div>

      {!document ? (
        <div className="mt-4 rounded-lg border border-ui-warning/25 bg-ui-warning-soft p-4 text-sm leading-7 text-ui-warning">
          {setupNotice ?? "ابتدا پروژه و صورت‌بها را ثبت کنید تا بتوانید ردیف اضافه کنید."}
        </div>
      ) : null}

      {document ? (
        <div
          className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden sm:mt-4 sm:block sm:space-y-4 sm:overflow-visible"
          data-tour="finalize-rows"
        >
          <details className="shrink-0 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3 sm:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center">
              <span className="flex w-full items-center justify-between gap-3">
                <span className="text-xs font-bold text-ui-text-muted">جمع کل</span>
                <span className="text-base font-black text-ui-primary">
                  {formatMoneyAmount(totals.totalAmount)}
                </span>
              </span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-ui-border-subtle pt-3 text-xs">
              <span className="text-ui-text-muted">شماره سند</span>
              <span className="truncate text-left font-bold text-ui-text-secondary">
                {cleanDisplayText(document.document_number, "—")}
              </span>
              <span className="text-ui-text-muted">سال فهرست‌بها</span>
              <span className="text-left font-bold text-ui-text-secondary">
                {selectedEditionYear ? String(selectedEditionYear) : "—"}
              </span>
              <span className="text-ui-text-muted">جمع فهرست‌بها</span>
              <span className="text-left font-bold text-ui-text-secondary">
                {formatMoneyAmount(totals.pricebookAmount)}
              </span>
              <span className="text-ui-text-muted">جمع ضرایب</span>
              <span className="text-left font-bold text-ui-text-secondary">
                {formatMoneyAmount(totals.coefficientAmount)}
              </span>
            </div>
          </details>

          <div className="hidden gap-3 sm:grid md:grid-cols-2 xl:grid-cols-4">
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

          <div className="hidden gap-3 sm:grid md:grid-cols-3">
            <InfoBox label="جمع فهرست‌بها" value={formatMoneyAmount(totals.pricebookAmount)} />
            <InfoBox label="جمع ضرایب" value={formatMoneyAmount(totals.coefficientAmount)} />
            <InfoBox label="جمع کل" value={formatMoneyAmount(totals.totalAmount)} />
          </div>

          {isLocked ? (
            <p className="text-xs leading-6 text-ui-primary">
              سند قفل شده است؛ ویرایش، حذف و افزودن خط غیرفعال شده‌اند.
            </p>
          ) : null}

          {actionSuccess ? (
            <p className="rounded-lg border border-ui-success/25 bg-ui-success-soft p-3 text-sm leading-7 text-ui-success">
              {actionSuccess}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-7 text-ui-danger">
              {actionError}
            </p>
          ) : null}

          {previewHtml ? (
            <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-ui-primary/20 sm:flex-none">
              <iframe
                className="h-full min-h-[20rem] w-full bg-white sm:h-[75vh]"
                sandbox=""
                srcDoc={previewHtml}
                title="پیش‌نمایش صورت وضعیت"
              />
            </section>
          ) : null}

          <div
            className={classNames(
              "min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain rounded-lg [scrollbar-width:thin] sm:hidden",
              previewHtml && "hidden"
            )}
          >
            {lines.length === 0 ? (
              <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-4 py-8 text-center text-sm text-ui-text-muted">
                هنوز خطی به صورت‌بها اضافه نشده است.
              </div>
            ) : null}
            {lines.map((line) => {
              const displayRows = getLineDisplayRows(line);

              return (
                <article
                  className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-2.5"
                  key={line.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-xs">
                      <span className="shrink-0 text-ui-text-muted">
                        خط {formatDecimal(line.line_no)}
                      </span>
                      <span className="truncate font-black text-ui-text-secondary">
                        {formatMoneyAmount(line.total_amount_snapshot)}
                      </span>
                    </div>
                    {renderLineActions(line)}
                  </div>

                  {editingLineId === line.id ? (
                    <label className="mt-2 flex items-center gap-2 rounded-lg bg-ui-surface/30 p-2 text-xs text-ui-text-muted">
                      مقدار
                      <input
                        autoFocus
                        className={classNames(inputClasses, "h-9 min-w-0 flex-1 text-left")}
                        dir="ltr"
                        inputMode="decimal"
                        onChange={(event) => setEditingQuantity(event.target.value)}
                        value={editingQuantity}
                      />
                    </label>
                  ) : null}

                  <div className="mt-2 space-y-2">
                    {displayRows.map((row, index) => (
                      <div
                        className="rounded-lg border border-ui-border-subtle bg-ui-surface/25 p-2.5"
                        key={`${row.parentLineId}-${row.rowCode ?? "row"}-${index}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-xs font-bold text-ui-primary">
                            {row.rowCode ?? "—"}
                          </span>
                          <span className="text-xs font-black text-ui-primary">
                            {formatMoneyAmount(row.total)}
                          </span>
                        </div>
                        <p className="mt-1.5 break-words text-sm font-bold leading-6 text-ui-text-primary">
                          {cleanDisplayText(row.title, "شرح ثبت نشده")}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-ui-text-muted">
                          <span>
                            {formatDecimal(row.quantity)} {cleanDisplayText(row.unit, "")}
                          </span>
                          <span className="min-w-0 truncate text-left">
                            {row.isStarredPrice ? "★ ستاره‌دار" : "بهای واحد"} ·{" "}
                            {hasPositiveMoneyValue(row.unitPrice)
                              ? formatMoneyAmount(row.unitPrice)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}

            {document.chapter_totals.length > 0 ? (
              <details className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-black text-ui-text-secondary">
                  جمع فصل‌ها
                </summary>
                <div className="mt-3 space-y-2">
                  {document.chapter_totals.map((chapterTotal) => (
                    <div
                      className="rounded-lg bg-ui-surface/30 p-2.5 text-xs"
                      key={chapterTotal.id}
                    >
                      <p className="font-bold text-ui-text-secondary">
                        {chapterTotal.chapter_code_snapshot} - {chapterTotal.chapter_title_snapshot}
                      </p>
                      <p className="mt-1 text-ui-text-muted">
                        جمع: {formatMoneyAmount(chapterTotal.final_total_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-ui-border-subtle sm:block">
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                <div className="grid grid-cols-[70px_110px_1fr_130px_90px_130px_130px_130px_130px_80px] gap-3 bg-ui-surface-subtle px-4 py-3 text-xs font-bold text-ui-text-secondary">
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
                  <div className="px-4 py-5 text-center text-sm text-ui-text-muted">
                    هنوز خطی به صورت‌بها اضافه نشده است.
                  </div>
                ) : null}
                <div className="max-h-[36vh] overflow-y-auto">
                  {lines.map((line: FinancialDocumentLine) => {
                    const displayRows = getLineDisplayRows(line);
                    const isExpanded =
                      displayRows.length > 1 ||
                      displayRows.some((row) => row.rowCode !== line.row_code_snapshot);

                    return (
                      <div key={line.id}>
                        {displayRows.map((row, index) => (
                          <div
                            className="grid grid-cols-[70px_110px_1fr_130px_90px_130px_130px_130px_130px_80px] gap-3 border-t border-ui-border-subtle px-4 py-3 text-sm text-ui-text-secondary"
                            key={`${row.parentLineId}-${row.rowCode ?? "row"}-${index}`}
                          >
                            <span>{index === 0 ? line.line_no : ""}</span>
                            <span className="font-mono text-ui-primary">
                              {row.rowCode ?? "—"}
                            </span>
                            <span
                              className="truncate"
                              title={cleanDisplayText(row.title, "شرح ثبت نشده")}
                            >
                              {cleanDisplayText(row.title, "شرح ثبت نشده")}
                            </span>
                            <span>
                              {editingLineId === line.id && index === 0 ? (
                                <input
                                  className={classNames(inputClasses, "h-9 text-left")}
                                  dir="ltr"
                                  inputMode="decimal"
                                  onChange={(event) => setEditingQuantity(event.target.value)}
                                  value={editingQuantity}
                                />
                              ) : (
                                formatDecimal(row.quantity)
                              )}
                            </span>
                            <span>{cleanDisplayText(row.unit, "—")}</span>
                            <span>
                              {row.isStarredPrice ? "★ ستاره‌دار · " : "قیمت رسمی · "}
                              {hasPositiveMoneyValue(row.unitPrice) ? formatMoneyAmount(row.unitPrice) : "-"}
                            </span>
                            <span>
                              {formatMoneyAmount(isExpanded ? row.total : line.base_amount_snapshot)}
                            </span>
                            <span>
                              {isExpanded
                                ? "—"
                                : formatMoneyAmount(line.coefficient_amount_snapshot)}
                            </span>
                            <span className="font-bold text-ui-text-primary">
                              {formatMoneyAmount(isExpanded ? row.total : line.total_amount_snapshot)}
                            </span>
                            {index === 0 ? renderLineActions(line) : <span />}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {document.chapter_totals.length > 0 ? (
            <details className="hidden rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-4 sm:block">
              <summary className="cursor-pointer text-sm font-black text-ui-text-primary">
                جمع فصل‌ها
              </summary>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {document.chapter_totals.map((chapterTotal) => (
                  <div
                    className="rounded-lg border border-ui-border-subtle bg-ui-surface p-3 text-sm"
                    key={chapterTotal.id}
                  >
                    <p className="font-bold text-ui-text-primary">
                      {chapterTotal.chapter_code_snapshot} -{" "}
                      {chapterTotal.chapter_title_snapshot}
                    </p>
                    <p className="mt-2 text-xs text-ui-text-muted">
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
