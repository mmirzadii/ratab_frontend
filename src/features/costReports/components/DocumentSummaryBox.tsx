import { useState } from "react";
import { FileText, Sheet } from "lucide-react";

import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import type { ProjectCoefficientSet } from "../../coefficients/coefficientApi";
import { formatMoneyAmount } from "../../../shared/utils/formatters";
import { getDocumentTotals } from "../costReportUtils";
import { DocumentLinesModal } from "./DocumentLinesModal";
import { ExcelImportWizardModal } from "../excelImport/ExcelImportWizardModal";

export function DocumentSummaryBox({
  coefficientSets,
  document,
  selectedCoefficientSetId,
  onSelectedCoefficientSetIdChange,
  onDocumentUpdated,
  onToast
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument;
  selectedCoefficientSetId: number | null;
  onSelectedCoefficientSetIdChange: (id: number | null) => void;
  onDocumentUpdated: (doc: FinancialDocument) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [showLines, setShowLines] = useState(false);
  const [showExcel, setShowExcel] = useState(false);

  const lines = document.lines ?? [];
  const uniqueItems = new Set(lines.map((l) => l.pricebook_item_id)).size;
  const totals = getDocumentTotals(document);
  const totalAmount = formatMoneyAmount(totals.totalAmount);

  return (
    <>
      <div
        className="rounded-lg border border-white/12 bg-slate-950/48 p-4 shadow-2xl shadow-slate-950/35 backdrop-blur-xl light:border-slate-200 light:bg-white/82 light:shadow-slate-200/60"
        dir="rtl"
      >
        <h3 className="text-sm font-black text-slate-300 light:text-slate-600">
          خلاصه صورت‌بها
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-center light:border-slate-100 light:bg-slate-50">
            <p className="text-lg font-black text-white light:text-slate-950">{uniqueItems}</p>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">تعداد آیتم</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-center light:border-slate-100 light:bg-slate-50">
            <p className="text-lg font-black text-white light:text-slate-950">{lines.length}</p>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">تعداد ردیف</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-center light:border-slate-100 light:bg-slate-50">
            <p className="truncate text-base font-black text-white light:text-slate-950" title={totalAmount}>
              {totalAmount}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">مجموع قیمت</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-50"
            onClick={() => setShowLines(true)}
            type="button"
          >
            <FileText className="h-4 w-4" />
            ویرایش صورت‌بها
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-200 transition hover:bg-emerald-400/15 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700 light:hover:bg-emerald-100"
            onClick={() => setShowExcel(true)}
            type="button"
          >
            <Sheet className="h-4 w-4" />
            افزودن اکسل (قیمت‌ها/مقادیر)
          </button>
        </div>
      </div>

      {showLines ? (
        <DocumentLinesModal
          document={document}
          onClose={() => setShowLines(false)}
          onDocumentUpdated={onDocumentUpdated}
          onToast={onToast}
        />
      ) : null}

      {showExcel ? (
        <ExcelImportWizardModal
          coefficientSets={coefficientSets}
          document={document}
          onClose={() => setShowExcel(false)}
          onDocumentUpdated={onDocumentUpdated}
          onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
          onToast={onToast}
          selectedCoefficientSetId={selectedCoefficientSetId}
        />
      ) : null}
    </>
  );
}
