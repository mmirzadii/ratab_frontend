import type { ReactNode } from "react";

import { GlassCard } from "./GlassCard";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <GlassCard className="p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-black text-white light:text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-300 light:text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </GlassCard>
  );
}
