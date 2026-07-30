import { CheckCircle2 } from "lucide-react";

import { GlassCard } from "../../../shared/components/GlassCard";
import { classNames } from "../../../shared/utils/classNames";
import { builderSections, lockedBuilderSectionMessage } from "../constants";
import type { BuilderSection } from "../types";

export function BuilderSectionNav({
  activeSection,
  completedSections,
  isUnlocked,
  onSelect
}: {
  activeSection: BuilderSection;
  completedSections: Partial<Record<BuilderSection, boolean>>;
  isUnlocked: boolean;
  onSelect: (section: BuilderSection) => void;
}) {
  const activeSectionIndex = builderSections.findIndex(
    (section) => section.id === activeSection
  );
  const activeSectionConfig = builderSections[activeSectionIndex];

  return (
    <GlassCard className="p-2 lg:p-3" dir="rtl">
      <div className="mb-3 hidden px-2 lg:block">
        <p className="text-xs font-bold text-ui-text-muted">مراحل ساخت صورت‌بها</p>
      </div>
      <nav className="grid grid-cols-5 gap-1 lg:flex lg:flex-col lg:gap-2">
        {builderSections.map((section) => {
          const enabled =
            section.id === "project" || section.id === "document" || isUnlocked;
          const isActive = activeSection === section.id;
          const isDone = completedSections[section.id] === true;
          const Icon = section.icon;

          return (
            <button
              className={classNames(
                "group flex min-w-0 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-center transition motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus lg:flex-row lg:gap-2 lg:p-2 lg:text-right",
                isActive
                  ? "border-ui-primary/55 bg-ui-primary-soft text-ui-primary shadow-md shadow-brand-soft/20"
                  : isDone
                    ? "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-muted hover:border-ui-border-default hover:bg-ui-surface-subtle"
                    : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-secondary hover:border-ui-border-default hover:bg-ui-surface-hover",
                !enabled && "cursor-not-allowed opacity-40 hover:border-ui-border-subtle hover:bg-ui-surface-subtle"
              )}
              disabled={!enabled}
              key={section.id}
              onClick={() => onSelect(section.id)}
              title={enabled ? section.title : lockedBuilderSectionMessage}
              type="button"
            >
              <span
                className={classNames(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition motion-safe:duration-150 lg:h-9 lg:w-9",
                  isActive
                    ? "border-ui-primary/60 bg-ui-primary text-ui-primary-foreground"
                    : isDone
                      ? "border-ui-success/30 bg-ui-success-soft text-ui-success"
                      : "border-ui-border-subtle bg-ui-surface/30 text-ui-text-muted"
                )}
              >
                {isDone && !isActive ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="w-full min-w-0 lg:w-auto">
                <span className="block truncate text-[9px] font-black sm:text-[11px] lg:text-xs">
                  <span className="hidden lg:inline lg:me-1">{section.number}</span>
                  {section.id === "pricebook" ? "فهرست" : section.shortLabel}
                </span>
                <span className="hidden text-[11px] leading-5 text-ui-text-muted sm:block lg:block">
                  {section.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
      {activeSectionConfig ? (
        <p className="mt-2 truncate px-1 text-center text-[11px] font-bold text-ui-text-secondary lg:hidden">
          مرحله {activeSectionIndex + 1} از {builderSections.length}: {activeSectionConfig.shortLabel}
        </p>
      ) : null}
    </GlassCard>
  );
}
