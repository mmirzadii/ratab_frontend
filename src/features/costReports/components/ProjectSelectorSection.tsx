import { Loader2 } from "lucide-react";

import type { Project } from "../../projects/projectApi";
import { useListCompanyProjectsQuery } from "../../projects/projectApi";
import { GlassCard } from "../../../shared/components/GlassCard";
import { cleanDisplayText } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";

export function ProjectSelectorSection({
  companyId,
  isLocked,
  onSelect,
  selectedProject
}: {
  companyId: number;
  isLocked: boolean;
  onSelect: (project: Project | null) => void;
  selectedProject: Project | null;
}) {
  const { data: projects = [], isLoading, error } = useListCompanyProjectsQuery(companyId);

  return (
    <GlassCard className="p-3 sm:p-6">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 light:text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال دریافت پروژه‌ها
        </div>
      ) : error ? (
        <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          دریافت پروژه‌ها ناموفق بود. دوباره تلاش کنید.
        </p>
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3 text-sm leading-7 text-amber-100 light:text-amber-800">
          هنوز پروژه‌ای برای این شرکت ثبت نشده است. ابتدا از داشبورد شرکت یک پروژه بسازید.
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <select
              className={inputClasses}
              disabled={isLocked}
              onChange={(e) => {
                const id = Number(e.target.value);
                onSelect(id ? (projects.find((p) => p.id === id) ?? null) : null);
              }}
              value={selectedProject?.id ?? ""}
            >
              <option value="">— یک پروژه انتخاب کنید —</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {cleanDisplayText(project.name, "پروژه بدون نام")}
                </option>
              ))}
            </select>
            {isLocked ? (
              <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
                این صورت‌بها به پروژه انتخاب‌شده متصل است و قابل تغییر نیست.
              </p>
            ) : null}
          </div>

          {selectedProject ? (
            <div className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-3 sm:p-4">
              <p className="hidden text-sm font-bold text-violet-100 light:text-violet-800 sm:block">
                {cleanDisplayText(selectedProject.name, "پروژه بدون نام")}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 light:text-slate-500 sm:mt-1 sm:block">
                {selectedProject.contract_number ? (
                  <p>شماره قرارداد: {selectedProject.contract_number}</p>
                ) : null}
                {selectedProject.employer_name ? (
                  <p className="sm:mt-0.5">کارفرما: {selectedProject.employer_name}</p>
                ) : null}
                {!selectedProject.contract_number && !selectedProject.employer_name ? (
                  <p className="sm:hidden">پروژه انتخاب شد.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </GlassCard>
  );
}
