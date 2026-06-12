import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { classNames } from "../utils/classNames";

export function HelpHint({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={classNames("relative inline-flex", className)}>
      <button
        aria-label="راهنما"
        className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-200 light:text-slate-400 light:hover:text-slate-600"
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        tabIndex={0}
        type="button"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <span className="absolute bottom-full right-0 z-50 mb-1.5 w-56 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-200 shadow-lg light:border-slate-200 light:bg-white light:text-slate-700">
          {text}
        </span>
      ) : null}
    </span>
  );
}
