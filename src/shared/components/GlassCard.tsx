import type { HTMLAttributes, PropsWithChildren } from "react";

type GlassCardProps = PropsWithChildren<HTMLAttributes<HTMLElement> & {
  className?: string;
  interactive?: boolean;
}>;

export function GlassCard({
  children,
  className = "",
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <section
      className={`rounded-lg border border-white/14 bg-slate-950/52 shadow-2xl shadow-slate-950/35 backdrop-blur-xl light:border-slate-200 light:bg-white/82 light:shadow-slate-200/60 ${
        interactive
          ? "transition hover:border-brand-300/35 hover:bg-brand-950/40 light:hover:border-brand-200 light:hover:bg-brand-50/60"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
