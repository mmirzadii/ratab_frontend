import type { PropsWithChildren } from "react";

type GlassCardProps = PropsWithChildren<{
  className?: string;
  interactive?: boolean;
}>;

export function GlassCard({ children, className = "", interactive = false }: GlassCardProps) {
  return (
    <section
      className={`rounded-lg border border-white/10 bg-slate-950/42 shadow-2xl shadow-slate-950/30 backdrop-blur-xl light:border-slate-200 light:bg-white/72 light:shadow-slate-200/60 ${
        interactive
          ? "transition hover:border-emerald-300/35 hover:bg-slate-900/55 light:hover:bg-white"
          : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}
