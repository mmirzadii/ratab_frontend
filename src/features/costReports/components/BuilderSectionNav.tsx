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
    <GlassCard className="sticky top-20 h-fit p-3" dir="rtl">
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
                "group flex min-w-[104px] items-center gap-2 rounded-lg border p-2 text-right transition lg:min-w-0",
                isActive
                  ? "border-emerald-300/45 bg-emerald-400/15 text-white shadow-lg shadow-emerald-950/20 light:text-slate-950"
                  : "border-white/10 bg-white/6 text-slate-300 hover:border-white/20 hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700",
                !enabled && "cursor-not-allowed opacity-45 hover:border-white/10 hover:bg-white/6"
              )}
              disabled={!enabled}
              key={section.id}
              onClick={() => onSelect(section.id)}
              title={enabled ? section.title : lockedBuilderSectionMessage}
              type="button"
            >
              <span
                className={classNames(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-black",
                  isDone
                    ? "border-emerald-300/45 bg-emerald-400/20 text-emerald-100 light:text-emerald-700"
                    : "border-white/10 bg-slate-950/30 text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-600"
                )}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
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
