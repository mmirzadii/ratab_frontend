import type { HTMLAttributes, PropsWithChildren } from "react";

import { classNames } from "../utils/classNames";

type GlassCardProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    className?: string;
    interactive?: boolean;
    /** Tighter padding density for operational lists/forms. */
    density?: "comfortable" | "compact";
  }
>;

/**
 * Surface container for authenticated UI.
 * Prefer subtle border + restrained shadow over heavy glass/glow.
 */
export function GlassCard({
  children,
  className = "",
  interactive = false,
  density = "comfortable",
  ...props
}: GlassCardProps) {
  return (
    <section
      className={classNames(
        "rounded-xl border border-ui-border-subtle bg-ui-surface shadow-ui-sm",
        density === "compact" ? "p-3 sm:p-3.5" : "",
        interactive &&
          "motion-safe:transition-[border-color,background-color,box-shadow] motion-safe:duration-150 hover:border-ui-border-default hover:bg-ui-surface-hover hover:shadow-ui",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
