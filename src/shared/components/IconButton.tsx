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
          ? "border-ui-primary/30 bg-ui-primary-soft text-ui-primary"
          : "border-transparent text-ui-text-muted hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary",
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
