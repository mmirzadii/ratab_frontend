import { X } from "lucide-react";
import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { removeToast, type Toast } from "../../features/ui/uiSlice";
import { classNames } from "../utils/classNames";

const toastColorClasses: Record<Toast["type"], string> = {
  success: "bg-ui-success-soft border-ui-success/40 text-ui-success",
  error: "bg-ui-danger-soft border-ui-danger/40 text-ui-danger",
  info: "bg-ui-surface-elevated border-ui-border-default text-ui-text-primary"
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(toast.id)), 4000);
    return () => clearTimeout(t);
  }, [toast.id, dispatch]);

  return (
    <div
      className={classNames(
        "flex min-w-[220px] max-w-xs items-start gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-ui backdrop-blur-md",
        toastColorClasses[toast.type]
      )}
      role="alert"
    >
      <span className="flex-1 leading-6">{toast.message}</span>
      <button
        aria-label="بستن"
        className="mt-0.5 shrink-0 text-ui-text-muted transition hover:text-ui-text-primary"
        onClick={() => dispatch(removeToast(toast.id))}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useAppSelector((state) => state.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div className="pointer-events-auto" key={toast.id}>
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
