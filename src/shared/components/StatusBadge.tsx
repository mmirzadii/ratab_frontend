import type { PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type BadgeTone = "emerald" | "violet" | "amber" | "slate" | "brand";

type StatusBadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
}>;

const toneClasses: Record<BadgeTone, string> = {
  brand:   "border-brand-300/25 bg-brand-400/10 text-brand-200 light:text-brand-800",
  emerald: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200 light:text-emerald-800",
  violet:  "border-violet-300/25 bg-violet-400/10 text-violet-200 light:text-violet-800",
  amber:   "border-amber-300/25 bg-amber-400/10 text-amber-100 light:text-amber-800",
  slate:   "border-white/10 bg-white/7 text-slate-300 light:border-slate-200 light:bg-white light:text-slate-600"
};

export function StatusBadge({ children, className, tone = "slate" }: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
