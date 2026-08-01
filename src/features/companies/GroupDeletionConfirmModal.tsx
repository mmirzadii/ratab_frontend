import { useEffect, useId } from "react";
import { Loader2, X } from "lucide-react";

import type { DeletionPreview } from "./companyGroupsApi";
import {
  formatDeletionCountEntries,
  formatGroupDeletionError
} from "./deletionPreview";
import { Button } from "../../shared/components/Button";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { formatDecimal } from "../../shared/utils/formatters";

export function GroupDeletionConfirmModal({
  confirmLabel,
  deleting,
  errorMessage,
  onCancel,
  onConfirm,
  preview,
  previewError,
  previewLoading,
  title,
  warningFallback
}: {
  confirmLabel: string;
  deleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  preview: DeletionPreview | null;
  previewError: unknown;
  previewLoading: boolean;
  title: string;
  warningFallback: string;
}) {
  const titleId = useId();
  const countEntries = formatDeletionCountEntries(preview?.counts);
  const warningText = preview?.warning_message_fa?.trim() || warningFallback;
  const previewErrorMessage = previewError
    ? formatGroupDeletionError(
        previewError,
        getApiErrorMessage(previewError, "پیش‌نمایش حذف دریافت نشد.")
      )
    : null;
  const canSubmit =
    !previewLoading &&
    !previewError &&
    preview != null &&
    preview.can_delete !== false &&
    Boolean(preview.confirmation_required) &&
    !deleting;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[130] flex max-h-dvh items-end justify-center overflow-y-auto bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      data-testid="group-deletion-confirm"
      onMouseDown={(event) => {
        if (!deleting && event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-rose-300/25 bg-ui-surface shadow-ui sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ui-border-subtle px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-black text-rose-200" id={titleId}>
              {title}
            </h2>
            <p className="mt-1 text-xs leading-6 text-ui-text-muted">
              این عملیات برگشت‌پذیر نیست. قبل از تأیید، جزئیات زیر را بررسی کنید.
            </p>
          </div>
          <button
            aria-label="انصراف"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
            disabled={deleting}
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          {previewLoading ? (
            <div className="flex min-h-24 items-center justify-center gap-2 text-sm font-bold text-ui-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin text-ui-primary" />
              در حال دریافت پیش‌نمایش حذف
            </div>
          ) : null}

          {previewErrorMessage ? (
            <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm leading-6 text-rose-100">
              {previewErrorMessage}
            </p>
          ) : null}

          {!previewLoading && preview ? (
            <>
              <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2.5 text-sm leading-7 text-rose-50">
                {warningText}
              </p>
              {countEntries.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2">
                  {countEntries.map((entry) => (
                    <li
                      className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-3 py-2"
                      key={entry.key}
                    >
                      <p className="text-[11px] font-bold text-ui-text-muted">{entry.label}</p>
                      <p className="mt-1 text-sm font-black text-ui-text-primary" dir="ltr">
                        {formatDecimal(entry.value)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ui-text-muted">
                  شمارش جزئی از سرور برنگشت؛ حذف همچنان وابستگی‌های مرتبط را پاک می‌کند.
                </p>
              )}
            </>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm leading-6 text-rose-100">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
          <Button disabled={deleting} onClick={onCancel} type="button" variant="secondary">
            انصراف
          </Button>
          <Button disabled={!canSubmit} onClick={onConfirm} type="button" variant="danger">
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال حذف
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
