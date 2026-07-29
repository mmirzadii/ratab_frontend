import { X } from "lucide-react";
import type { ReactNode } from "react";

import { classNames } from "../../../shared/utils/classNames";

export function WorkspaceDetailsDrawer({
  open,
  title,
  onClose,
  children,
  mode = "overlay",
  scrollBody = true
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** inline = left pane on wide screens; overlay = modal drawer */
  mode?: "inline" | "overlay";
  /** When false, children manage their own scroll (sticky header/tabs). */
  scrollBody?: boolean;
}) {
  if (!open) return null;

  const bodyClass = classNames(
    "min-h-0 flex-1",
    scrollBody ? "overflow-y-auto p-3 [scrollbar-width:thin]" : "flex flex-col overflow-hidden"
  );

  if (mode === "inline") {
    return (
      <aside
        aria-label={title}
        className="flex w-[22rem] shrink-0 flex-col border-l border-white/10 bg-slate-950/50 light:border-slate-200 light:bg-white/95 xl:w-[24rem]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/8 px-3 light:border-slate-200">
          <h2 className="truncate text-sm font-black text-white light:text-slate-950">{title}</h2>
          <button
            aria-label="بستن جزئیات"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={bodyClass}>{children}</div>
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-start bg-slate-950/55 backdrop-blur-sm" dir="rtl">
      <button aria-label="بستن جزئیات" className="flex-1 cursor-default" onClick={onClose} type="button" />
      <aside
        className={classNames(
          "flex h-full w-[min(24rem,92vw)] flex-col border-r border-white/10 bg-slate-950 shadow-2xl light:border-slate-200 light:bg-white"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/8 px-3 light:border-slate-200">
          <h2 className="truncate text-sm font-black text-white light:text-slate-950">{title}</h2>
          <button
            aria-label="بستن جزئیات"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={bodyClass}>{children}</div>
      </aside>
    </div>
  );
}

