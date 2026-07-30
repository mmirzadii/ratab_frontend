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
import {
  getLineDisplayRows,
  hasPositiveMoneyValue,
  isFinancialDocumentLocked,
  isPositiveDecimal,
  normalizeQuantityValue
} from "../costReportUtils";

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
        "fixed inset-0 z-[100] flex items-end justify-center bg-ui-overlay backdrop-blur-sm sm:items-start sm:p-4 sm:pt-12",
        secondaryNav ? "lg:right-[19rem]" : "lg:right-20"
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-ui-border-subtle bg-ui-surface shadow-ui sm:h-auto sm:max-h-[80dvh] sm:rounded-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ui-border-subtle bg-ui-surface px-3 py-1.5 sm:p-4">
          <h2 className="text-base font-black text-ui-text-primary">ردیف‌های صورت‌بها</h2>
          <button
            aria-label="بستن"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary sm:h-9 sm:w-9"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 overscroll-contain sm:p-4">
          {localLines.length === 0 ? (
            <p className="py-8 text-center text-sm text-ui-text-muted">
              هنوز ردیفی اضافه نشده است.
            </p>
          ) : null}
          <div className="space-y-2">
            {localLines.map((line) => {
              const isEditingThis = editingLineId === line.id;
              const isDeletingThis = deletingLineId === line.id;
              const isSavingThis = savingLineId === line.id;
              const displayRows = getLineDisplayRows(line);

              return (
                <GlassCard className="p-2.5 sm:p-3" key={line.id}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ui-text-primary">
                        {cleanDisplayText(line.description_snapshot, "شرح ثبت نشده")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-ui-text-muted">
                        <span>خط {formatDecimal(line.line_no)}</span>
                        {displayRows.length > 1 ? (
                          <span>{formatDecimal(displayRows.length)} ردیف محاسبه‌شده</span>
                        ) : null}
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <span className="text-ui-text-muted">مقدار:</span>
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
                        <span className="font-bold text-ui-text-secondary">
                          {formatMoneyAmount(line.total_amount_snapshot)}
                        </span>
                      </div>
                      {isEditingThis && editError ? (
                        <p className="mt-1 text-xs text-rose-400">{editError}</p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {isEditingThis ? (
                        <>
                          <button
                            aria-label="ذخیره"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ui-primary/30 bg-ui-primary-soft text-ui-primary transition hover:bg-ui-surface-selected disabled:opacity-40"
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ui-border-subtle bg-ui-surface-subtle text-ui-text-muted transition hover:bg-ui-surface-hover hover:text-ui-text-primary disabled:opacity-40"
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:bg-ui-primary-soft hover:text-ui-primary disabled:opacity-40"
                            disabled={isBusy || isLocked}
                            onClick={() => startEditing(line)}
                            title="ویرایش مقدار"
                            type="button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="حذف ردیف"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
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
                  <div className="mt-3 space-y-2">
                    {displayRows.map((row, index) => (
                      <div
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 rounded-lg border border-ui-border-subtle bg-ui-surface/25 p-2.5 text-xs sm:grid-cols-[5.5rem_1fr_6rem_7rem_7rem] sm:items-center sm:gap-2 sm:p-3"
                        key={`${row.parentLineId}-${row.rowCode ?? "row"}-${index}`}
                      >
                        <span className="order-1 font-mono font-bold text-ui-primary sm:order-none">
                          {row.rowCode ?? "—"}
                        </span>
                        <span
                          className="order-3 col-span-2 min-w-0 truncate font-bold text-ui-text-primary sm:order-none sm:col-span-1"
                          title={cleanDisplayText(row.title, "شرح ثبت نشده")}
                        >
                          {cleanDisplayText(row.title, "شرح ثبت نشده")}
                        </span>
                        <span className="order-4 text-ui-text-muted sm:order-none">
                          {formatDecimal(row.quantity)} {cleanDisplayText(row.unit, "")}
                        </span>
                        <span className="order-5 truncate text-left text-ui-text-secondary sm:order-none sm:text-right">
                          {row.isStarredPrice ? "★ ستاره‌دار · " : "قیمت رسمی · "}
                          {hasPositiveMoneyValue(row.unitPrice) ? formatMoneyAmount(row.unitPrice) : "-"}
                        </span>
                        <span className="order-2 font-bold text-ui-text-secondary sm:order-none">
                          {formatMoneyAmount(row.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </div>

        </div>
        <div className="shrink-0 border-t border-ui-border-subtle px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:p-4">
          <button
            className="min-h-11 w-full rounded-lg border border-ui-border-subtle bg-ui-surface-subtle py-2.5 text-sm font-bold text-ui-text-secondary transition hover:bg-ui-surface-hover"
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
