import type { ReactNode } from "react";

import { classNames } from "../utils/classNames";

export function Field({
  children,
  className,
  label,
  required = false
}: {
  children: ReactNode;
  className?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className={classNames("space-y-1.5 sm:space-y-2", className)}>
      <span className="text-sm font-bold text-ui-text-secondary">
        {label}
        {required ? <span className="text-ui-primary"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
