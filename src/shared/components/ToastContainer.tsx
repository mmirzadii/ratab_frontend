import { X } from "lucide-react";
import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { removeToast, type Toast } from "../../features/ui/uiSlice";
import { classNames } from "../utils/classNames";

const toastColorClasses: Record<Toast["type"], string> = {
  success: "bg-success-500/15 border-success-500/40 text-success-200 light:bg-success-50 light:border-success-400 light:text-success-800",
  error:   "bg-danger-500/15 border-danger-500/40 text-danger-200 light:bg-danger-50 light:border-danger-400 light:text-danger-800",
  info:    "bg-slate-700/60 border-white/10 text-slate-200 light:bg-white light:border-slate-200 light:text-slate-700"
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
        "flex min-w-[220px] max-w-xs items-start gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-xl backdrop-blur-md",
        toastColorClasses[toast.type]
      )}
      role="alert"
    >
      <span className="flex-1 leading-6">{toast.message}</span>
      <button
        aria-label="بستن"
        className="mt-0.5 shrink-0 opacity-60 transition hover:opacity-100"
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
