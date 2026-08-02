import type { ReactNode } from "react";

import { GlassCard } from "./GlassCard";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <GlassCard className="p-5 text-center sm:p-6">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-ui-primary/20 bg-ui-primary-soft text-ui-primary sm:h-12 sm:w-12">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-black text-ui-text-primary sm:text-lg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ui-text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </GlassCard>
  );
}
