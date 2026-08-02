import type { ReactNode } from "react";

import { ContextualHelp } from "./ContextualHelp";
import { classNames } from "../utils/classNames";

export function Field({
  children,
  className,
  label,
  required = false,
  optional = false,
  help
}: {
  children: ReactNode;
  className?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  help?: string;
}) {
  return (
    <div className={classNames("block space-y-1.5", className)}>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-ui-text-secondary">
          {label}
          {required ? <span className="text-ui-primary"> *</span> : null}
          {optional && !required ? (
            <span className="mr-1.5 text-[11px] font-medium text-ui-text-muted">اختیاری</span>
          ) : null}
        </span>
        {help ? <ContextualHelp label={`راهنمای ${label}`} text={help} /> : null}
      </div>
      {children}
    </div>
  );
}
