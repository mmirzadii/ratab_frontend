import type { PropsWithChildren } from "react";

type TooltipProps = PropsWithChildren<{
  label: string;
}>;

export function Tooltip({ children, label }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute right-14 top-2.5 z-40 rounded-lg border border-ui-border-default bg-ui-surface-elevated px-3 py-1.5 text-xs font-bold text-ui-text-primary opacity-0 shadow-ui transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
