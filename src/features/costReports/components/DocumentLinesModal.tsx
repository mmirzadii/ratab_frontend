import { useState } from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";

import type { FinancialDocument, FinancialDocumentLine } from "../../financialDocuments/financialDocumentApi";
import {
  useDeleteFinancialDocumentLineMutation,
  useRecalculateFinancialDocumentMutation,
  useUpdateFinancialDocumentLineMutation
} from "../../financialDocuments/financialDocumentApi";
import { useAppShell } from "../../../app/appShellContext";
import { GlassCard } from "../../../shared/components/GlassCard";
import { classNames } from "../../../shared/utils/classNames";
import { cleanDisplayText, formatDecimal, formatMoneyAmount } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";
import { isFinancialDocumentLocked, isPositiveDecimal, normalizeQuantityValue } from "../costReportUtils";

export function DocumentLinesModal({
  document,
  onClose,
  onDocumentUpdated
}: {
  document: FinancialDocument;
  onClose: () => void;
  onDocumentUpdated: (doc: FinancialDocument) => void;
}) {
  const { secondaryNav } = useAppShell();
  const [deleteFinancialDocumentLine] = useDeleteFinancialDocumentLineMutation();
  const [updateFinancialDocumentLine] = useUpdateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] =
    useRecalculateFinancialDocumentMutation();
  const [deletingLineId, setDeletingLineId] = useState<number | null>(null);
  const [savingLineId, setSavingLineId] = useState<number | null>(null);
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [localLines, setLocalLines] = useState<FinancialDocumentLine[]>(
    () => document.lines ?? []
  );
  const isLocked = isFinancialDocumentLocked(document);
  const isBusy = recalculateState.isLoading || deletingLineId !== null || savingLineId !== null;

  function startEditing(line: FinancialDocumentLine) {
    setEditingLineId(line.id);
    setEditingQuantity(line.quantity);
    setEditError(null);
  }

  function cancelEditing() {
    setEditingLineId(null);
    setEditingQuantity("");
    setEditError(null);
  }

  async function handleSave(line: FinancialDocumentLine) {
    const normalized = normalizeQuantityValue(editingQuantity);
    if (!isPositiveDecimal(normalized)) {
      setEditError("مقدار باید یک عدد مثبت باشد.");
      return;
    }
    setSavingLineId(line.id);
    setEditError(null);
    try {
      await updateFinancialDocumentLine({
        documentId: document.id,
        lineId: line.id,
        body: { quantity: normalized }
      }).unwrap();
      const updated = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updated);
      setLocalLines(updated.lines ?? []);
      setEditingLineId(null);
      setEditingQuantity("");
    } catch {
      setEditError("ذخیره ناموفق بود. دوباره تلاش کنید.");
    } finally {
      setSavingLineId(null);
    }
  }

  async function handleDelete(line: FinancialDocumentLine) {
    setDeletingLineId(line.id);
    try {
      await deleteFinancialDocumentLine({
        documentId: document.id,
        lineId: line.id
      }).unwrap();
      const updated = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updated);
      setLocalLines((prev) => prev.filter((l) => l.id !== line.id));
    } catch {
      // silent — line stays visible
    } finally {
      setDeletingLineId(null);
    }
  }

  return (
    <div
      className={classNames(
        "fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/70 p-3 pt-8 backdrop-blur-sm sm:p-4 sm:pt-12",
        secondaryNav ? "lg:right-[19rem]" : "lg:right-20"
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[80dvh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-slate-950 shadow-2xl light:border-slate-200 light:bg-white"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/95 p-4 light:border-slate-200 light:bg-white/95">
          <h2 className="text-base font-black text-white light:text-slate-950">ردیف‌های صورت‌بها</h2>
          <button
            aria-label="بستن"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {localLines.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400 light:text-slate-500">
              هنوز ردیفی اضافه نشده است.
            </p>
          ) : null}
          <div className="space-y-2">
            {localLines.map((line) => {
              const isEditingThis = editingLineId === line.id;
              const isDeletingThis = deletingLineId === line.id;
              const isSavingThis = savingLineId === line.id;

              return (
                <GlassCard className="p-3" key={line.id}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-100 light:text-slate-900">
                        {cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400 light:text-slate-500">
                        <span className="font-mono text-emerald-200 light:text-emerald-700">
                          {line.row_code_snapshot}
                        </span>
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <span className="text-slate-400">مقدار:</span>
                            <input
                              autoFocus
                              className={classNames(inputClasses, "h-7 w-24 text-left text-xs")}
                              dir="ltr"
                              inputMode="decimal"
                              onChange={(e) => {
                                setEditingQuantity(e.target.value);
                                setEditError(null);
                              }}
                              value={editingQuantity}
                            />
                          </div>
                        ) : (
                          <span>مقدار: {formatDecimal(line.quantity)}</span>
                        )}
                        <span className="font-bold text-slate-300 light:text-slate-600">
                          {formatMoneyAmount(line.total_amount_snapshot)}
                        </span>
                      </div>
                      {isEditingThis && editError ? (
                        <p className="mt-1 text-xs text-rose-400 light:text-rose-600">{editError}</p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {isEditingThis ? (
                        <>
                          <button
                            aria-label="ذخیره"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40 light:text-emerald-700"
                            disabled={isSavingThis}
                            onClick={() => void handleSave(line)}
                            title="ذخیره"
                            type="button"
                          >
                            {isSavingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            aria-label="انصراف"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/7 text-slate-400 transition hover:bg-white/12 hover:text-white disabled:opacity-40"
                            disabled={isSavingThis}
                            onClick={cancelEditing}
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-40"
                            disabled={isBusy || isLocked}
                            onClick={() => startEditing(line)}
                            title="ویرایش مقدار"
                            type="button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="حذف ردیف"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                            disabled={isDeletingThis || isBusy || isLocked}
                            onClick={() => void handleDelete(line)}
                            title="حذف ردیف"
                            type="button"
                          >
                            {isDeletingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <button
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/8 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-800"
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
