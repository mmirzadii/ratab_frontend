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
  return (
    <GlassCard className="p-3" dir="rtl">
      <div className="mb-3 hidden px-2 lg:block">
        <p className="text-xs font-bold text-slate-400 light:text-slate-500">مراحل ساخت صورت‌بها</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {builderSections.map((section) => {
          const enabled =
            section.id === "project" || section.id === "document" || isUnlocked;
          const isActive = activeSection === section.id;
          const isDone = completedSections[section.id] === true;
          const Icon = section.icon;

          return (
            <button
              className={classNames(
                "group flex min-w-[104px] items-center gap-2 rounded-lg border p-2 text-right transition motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 lg:min-w-0",
                isActive
                  ? "border-success-300/55 bg-success-400/12 text-white shadow-md shadow-success-950/20 light:border-success-400/60 light:bg-success-50 light:text-slate-950"
                  : isDone
                    ? "border-white/10 bg-white/5 text-slate-400 hover:border-white/18 hover:bg-white/8 light:border-slate-200 light:bg-white light:text-slate-500"
                    : "border-white/10 bg-white/6 text-slate-300 hover:border-white/20 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700",
                !enabled && "cursor-not-allowed opacity-40 hover:border-white/10 hover:bg-white/6"
              )}
              disabled={!enabled}
              key={section.id}
              onClick={() => onSelect(section.id)}
              title={enabled ? section.title : lockedBuilderSectionMessage}
              type="button"
            >
              <span
                className={classNames(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition motion-safe:duration-150",
                  isActive
                    ? "border-success-400/60 bg-success-500 text-white light:border-success-500 light:bg-success-500 light:text-white"
                    : isDone
                      ? "border-success-300/30 bg-success-400/12 text-success-300 light:border-success-300/50 light:bg-success-50 light:text-success-600"
                      : "border-white/10 bg-slate-950/30 text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500"
                )}
              >
                {isDone && !isActive ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black">
                  <span className="me-1">{section.number}</span>
                  {section.shortLabel}
                </span>
                <span className="hidden text-[11px] leading-5 text-slate-400 light:text-slate-500 sm:block lg:block">
                  {section.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

    </GlassCard>
  );
}
