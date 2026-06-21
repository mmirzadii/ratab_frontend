import { FolderKanban, Loader2 } from "lucide-react";

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
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <FolderKanban className="mt-1 h-5 w-5 text-violet-200 light:text-violet-700" />
        <div>
          <h2 className="text-xl font-black text-white light:text-slate-950">انتخاب پروژه</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            پروژه‌ای را که این صورت‌بها به آن تعلق دارد انتخاب کنید.
          </p>
        </div>
      </div>

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
        <div className="space-y-4">
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
            <div className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-4">
              <p className="text-sm font-bold text-violet-100 light:text-violet-800">
                {cleanDisplayText(selectedProject.name, "پروژه بدون نام")}
              </p>
              {selectedProject.contract_number ? (
                <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                  شماره قرارداد: {selectedProject.contract_number}
                </p>
              ) : null}
              {selectedProject.employer_name ? (
                <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
                  کارفرما: {selectedProject.employer_name}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </GlassCard>
  );
}
