import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "brand" | "danger";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ui-primary text-ui-primary-foreground shadow-brand-soft hover:bg-ui-primary-hover active:bg-ui-primary-active",
  brand:
    "bg-ui-primary text-ui-primary-foreground shadow-brand-soft hover:bg-ui-primary-hover active:bg-ui-primary-active",
  secondary:
    "border border-ui-border-default bg-ui-surface text-ui-text-primary hover:bg-ui-surface-hover",
  ghost: "text-ui-text-secondary hover:bg-ui-surface-hover hover:text-ui-text-primary",
  danger: "bg-ui-danger text-ui-text-inverse hover:opacity-90"
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition",
        "motion-safe:active:scale-[.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
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
