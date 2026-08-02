import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "brand" | "danger";
type ButtonSize = "md" | "sm" | "icon";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ui-primary text-ui-primary-foreground shadow-ui-sm hover:bg-ui-primary-hover active:bg-ui-primary-active",
  brand:
    "bg-ui-primary text-ui-primary-foreground shadow-ui-sm hover:bg-ui-primary-hover active:bg-ui-primary-active",
  secondary:
    "border border-ui-border-default bg-ui-surface text-ui-text-primary hover:border-ui-border-strong hover:bg-ui-surface-hover",
  ghost: "text-ui-text-secondary hover:bg-ui-surface-hover hover:text-ui-text-primary",
  danger: "bg-ui-danger text-ui-text-inverse hover:opacity-90"
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 min-h-11 gap-2 rounded-[11px] px-4 text-sm",
  sm: "h-9 min-h-9 gap-1.5 rounded-[10px] px-3 text-xs",
  icon: "h-11 w-11 min-h-11 gap-0 rounded-[11px] px-0"
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center font-bold transition duration-150",
        "motion-safe:active:scale-[.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
