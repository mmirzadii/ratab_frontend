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
    <GlassCard className="p-4 text-center sm:p-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-ui-primary/20 bg-ui-primary-soft text-ui-primary sm:h-14 sm:w-14">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-black text-ui-text-primary sm:mt-4 sm:text-lg">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ui-text-secondary sm:leading-7">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center sm:mt-5">{action}</div> : null}
    </GlassCard>
  );
}
