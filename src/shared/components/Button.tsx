import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "brand";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-l from-success-400 to-teal-300 text-slate-950 shadow-emerald-soft hover:from-success-300 hover:to-teal-200",
  brand:
    "bg-brand-600 text-white shadow-brand-soft hover:bg-brand-500",
  secondary:
    "border border-white/10 bg-white/8 text-slate-100 hover:border-white/20 hover:bg-white/12 light:border-slate-200 light:bg-white light:text-slate-800 light:hover:bg-slate-50",
  ghost:
    "text-slate-300 hover:bg-white/8 hover:text-white light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-950"
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition",
        "motion-safe:active:scale-[.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60",
        "disabled:cursor-not-allowed disabled:opacity-55",
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
