import type { HTMLAttributes, PropsWithChildren } from "react";

type GlassCardProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    className?: string;
    interactive?: boolean;
  }
>;

export function GlassCard({
  children,
  className = "",
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <section
      className={
        interactive
          ? `rounded-lg border border-ui-border-subtle bg-ui-surface shadow-ui motion-safe:transition-all motion-safe:duration-150 hover:border-ui-border-default hover:bg-ui-surface-hover ${className}`
          : `rounded-lg border border-ui-border-subtle bg-ui-surface shadow-ui ${className}`
      }
      {...props}
    >
      {children}
    </section>
  );
}
