import { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";

import type { FinancialDocument } from "../../financialDocuments/financialDocumentApi";
import {
  useDeleteFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation
} from "../../financialDocuments/financialDocumentApi";
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export function DocumentLinesModal({
  document,
  onDocumentUpdated,
  onToast,
  onClose
}: {
  document: FinancialDocument;
  onDocumentUpdated: (doc: FinancialDocument) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
  onClose: () => void;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLine] = useDeleteFinancialDocumentLineMutation();
  const [recalculate] = useRecalculateFinancialDocumentMutation();

  async function handleDelete(lineId: number) {
    setDeletingId(lineId);
    try {
      await deleteLine({ documentId: document.id, lineId }).unwrap();
      const updatedDoc = await recalculate(document.id).unwrap();
      onDocumentUpdated(updatedDoc);
      onToast("ردیف حذف شد.", "success");
    } catch (err) {
      onToast(getApiErrorMessage(err), "error");
    } finally {
      setDeletingId(null);
    }
  }

  const lines = document.lines ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4"
      dir="rtl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-white/12 bg-slate-950/90 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/95">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 light:border-slate-200">
          <div>
            <h2 className="text-base font-black text-white light:text-slate-950">
              ردیف‌های صورت‌بها
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
              {lines.length} ردیف
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 light:text-slate-500">
                هنوز ردیفی اضافه نشده است.
              </p>
            ) : null}
            {lines.map((line) => (
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
                    <span>مقدار: {formatDecimal(line.quantity)}</span>
                    <span>جمع: {formatMoneyAmount(line.total_amount_snapshot)}</span>
                  </div>
                </div>
                <button
                  aria-label="حذف"
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                  disabled={deletingId === line.id}
                  onClick={() => void handleDelete(line.id)}
                  title="حذف ردیف"
                  type="button"
                >
                  {deletingId === line.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 px-5 py-4 light:border-slate-200">
          <button
            className="w-full rounded-lg border border-white/10 bg-white/8 py-3 text-base font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-800"
            onClick={onClose}
            type="button"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
