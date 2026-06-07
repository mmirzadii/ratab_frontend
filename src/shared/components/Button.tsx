import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-l from-emerald-400 to-teal-300 text-slate-950 shadow-emerald-soft hover:from-emerald-300 hover:to-teal-200",
  secondary:
    "border border-white/10 bg-white/8 text-slate-100 hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800",
  ghost:
    "text-slate-300 hover:bg-white/8 hover:text-white light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-950"
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
