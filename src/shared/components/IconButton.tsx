import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type IconButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
  }
>;

export function IconButton({ active = false, children, className, ...props }: IconButtonProps) {
  return (
    <button
      className={classNames(
        "flex h-12 w-12 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-45",
        active
          ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
          : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900",
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
