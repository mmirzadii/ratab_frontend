import type { PropsWithChildren } from "react";

type TooltipProps = PropsWithChildren<{
  label: string;
}>;

export function Tooltip({ children, label }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute right-14 top-2.5 z-40 rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
