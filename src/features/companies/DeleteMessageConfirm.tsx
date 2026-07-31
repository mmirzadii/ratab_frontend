import { Loader2, X } from "lucide-react";

import { Button } from "../../shared/components/Button";

export function DeleteMessageConfirm({
  pending,
  errorMessage,
  onCancel,
  onConfirm
}: {
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[130] flex max-h-dvh items-end justify-center overflow-y-auto bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      data-testid="delete-message-confirm"
      onMouseDown={(event) => {
        if (!pending && event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        aria-labelledby="delete-message-title"
        aria-modal="true"
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ui-border-subtle bg-ui-surface shadow-ui sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ui-border-subtle px-4 py-3">
          <div className="min-w-0">
            <h2
              className="text-base font-black text-ui-text-primary"
              id="delete-message-title"
            >
              حذف پیام
            </h2>
            <p className="mt-1 text-xs leading-5 text-ui-text-muted">
              پیام برای همه اعضا به صورت «پیام حذف شد» نمایش داده می‌شود.
            </p>
          </div>
          <button
            aria-label="انصراف"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage ? (
          <p className="mx-4 mt-3 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Button disabled={pending} onClick={onCancel} type="button" variant="secondary">
            انصراف
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="danger">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال حذف
              </>
            ) : (
              "حذف"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
