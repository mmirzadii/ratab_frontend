import type { PropsWithChildren } from "react";

type GlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <section
      className={`rounded-lg border border-white/10 bg-slate-950/42 shadow-2xl shadow-slate-950/30 backdrop-blur-xl light:border-slate-200 light:bg-white/72 light:shadow-slate-200/60 ${className}`}
    >
      {children}
    </section>
  );
}
