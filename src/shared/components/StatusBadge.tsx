import type { PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

/** Semantic badge tones. Legacy emerald/violet map to success/brand. */
type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "brand" | "emerald" | "violet" | "amber" | "slate";

type StatusBadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
}>;

const toneClasses: Record<BadgeTone, string> = {
  brand: "border-ui-primary/25 bg-ui-primary-soft text-ui-primary",
  info: "border-ui-info/25 bg-ui-info-soft text-ui-info",
  success: "border-ui-success/25 bg-ui-success-soft text-ui-success",
  warning: "border-ui-warning/25 bg-ui-warning-soft text-ui-warning",
  danger: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger",
  neutral: "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary",
  // Legacy aliases
  emerald: "border-ui-success/25 bg-ui-success-soft text-ui-success",
  violet: "border-ui-primary/25 bg-ui-primary-soft text-ui-primary",
  amber: "border-ui-warning/25 bg-ui-warning-soft text-ui-warning",
  slate: "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary"
};

export function StatusBadge({ children, className, tone = "neutral" }: StatusBadgeProps) {
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
