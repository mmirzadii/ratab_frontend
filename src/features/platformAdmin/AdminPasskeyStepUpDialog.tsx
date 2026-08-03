import { useEffect, useId, useRef } from "react";
import { Fingerprint } from "lucide-react";

import { Button } from "../../shared/components/Button";

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
};

export function AdminPasskeyStepUpDialog({ open, busy, error, onCancel, onRetry }: Props) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-t-2xl border border-ui-border-subtle bg-ui-surface p-5 shadow-ui sm:rounded-2xl"
        onPointerDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-ui-border-subtle bg-ui-surface-subtle text-ui-primary">
            <Fingerprint aria-hidden className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-ui-text-primary" id={titleId}>
              تایید Passkey
            </h2>
            <p className="mt-1 text-sm leading-7 text-ui-text-secondary">
              برای ادامه این عملیات حساس، هویت خود را با Passkey تایید کنید.
            </p>
          </div>
        </div>

        <p aria-live="polite" className="mt-4 text-sm text-ui-text-muted">
          {busy ? "در انتظار تایید Passkey…" : "در صورت نیاز دوباره تلاش کنید."}
        </p>

        {error ? (
          <p aria-live="assertive" className="mt-3 text-sm font-bold text-ui-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-[11px] border border-ui-border-default bg-ui-surface px-4 text-sm font-bold text-ui-text-primary hover:bg-ui-surface-hover disabled:opacity-55"
            disabled={busy}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            انصراف
          </button>
          <Button disabled={busy} onClick={onRetry} type="button">
            {busy ? "در حال تایید…" : "تلاش مجدد"}
          </Button>
        </div>
      </div>
    </div>
  );
}
