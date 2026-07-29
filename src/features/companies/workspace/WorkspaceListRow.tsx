import type { ElementType, ReactNode } from "react";

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
        "flex min-h-[3.75rem] w-full items-center gap-3 border-b border-white/6 px-3 py-2 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/50 light:border-slate-100",
        selected
          ? "bg-emerald-400/14 light:bg-emerald-50"
          : "hover:bg-white/5 light:hover:bg-slate-50",
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
            ? "bg-emerald-400/20 text-emerald-100 light:bg-emerald-100 light:text-emerald-800"
            : "bg-white/8 text-slate-300 light:bg-slate-100 light:text-slate-600"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-white light:text-slate-950">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-slate-400 light:text-slate-500">
            {subtitle}
          </span>
        ) : null}
      </span>
      {badge ? <span className="shrink-0">{badge}</span> : null}
    </button>
  );
}

export function WorkspaceContextHeader({
  companyName,
  isActive,
  action,
  children
}: {
  companyName: string;
  isActive?: boolean;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="shrink-0 border-b border-white/8 light:border-slate-200">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white light:text-slate-950">{companyName}</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400 light:text-slate-500">
            {isActive ? "فعال" : "غیرفعال"}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
