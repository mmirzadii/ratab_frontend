import type { ElementType, ReactNode } from "react";

import { CompanyTokenBadge } from "../../../shared/components/CompanyTokenBadge";
import { classNames } from "../../../shared/utils/classNames";

export function WorkspaceListRow({
  avatarIcon: Icon,
  title,
  subtitle,
  badge,
  selected,
  onClick,
  disabled
}: {
  avatarIcon: ElementType;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-current={selected ? "true" : undefined}
      className={classNames(
        "flex min-h-[3.75rem] w-full items-center gap-3 border-b border-ui-border-subtle px-3 py-2 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ui-focus",
        selected
          ? "bg-ui-surface-selected"
          : "hover:bg-ui-surface-subtle ",
        disabled && "cursor-not-allowed opacity-50"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        className={classNames(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black",
          selected
            ? "bg-ui-primary-soft text-ui-primary"
            : "bg-ui-surface-subtle text-ui-text-secondary"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-ui-text-primary">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-ui-text-muted">
            {subtitle}
          </span>
        ) : null}
      </span>
      {badge ? <span className="shrink-0">{badge}</span> : null}
    </button>
  );
}

export function WorkspaceContextHeader({
  companyId,
  companyName,
  isActive,
  action,
  children
}: {
  companyId?: number;
  companyName: string;
  isActive?: boolean;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="shrink-0 border-b border-ui-border-subtle">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="min-w-0 truncate text-sm font-black text-ui-text-primary">
              {companyName}
            </p>
            {companyId != null && companyId > 0 ? <CompanyTokenBadge companyId={companyId} /> : null}
          </div>
          <p className="mt-0.5 text-[11px] font-bold text-ui-text-muted">
            {isActive ? "فعال" : "غیرفعال"}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
