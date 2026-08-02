import type { ReactNode } from "react";

import { classNames } from "../utils/classNames";

type PageHeaderProps = {
  title: string;
  /** Compact status/count under or beside the title. */
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Compact authenticated page header: one title, optional status, actions.
 * Do not wrap in a hero GlassCard.
 */
export function PageHeader({ title, status, actions, className }: PageHeaderProps) {
  return (
    <header
      className={classNames(
        "flex flex-col gap-3 border-b border-ui-border-subtle pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4",
        className
      )}
      data-testid="page-header"
    >
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-tight text-ui-text-primary sm:text-2xl">
          {title}
        </h1>
        {status ? (
          <div className="mt-0.5 text-xs font-bold text-ui-text-muted sm:text-sm">{status}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
