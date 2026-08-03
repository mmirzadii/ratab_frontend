import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import type { Project } from "../../projects/projectApi";
import { useListCompanyProjectsQuery } from "../../projects/projectApi";
import { CreateProjectSheet } from "../../projects/CreateProjectSheet";
import { Button } from "../../../shared/components/Button";
import { GlassCard } from "../../../shared/components/GlassCard";
import { cleanDisplayText } from "../../../shared/utils/formatters";
import { inputClasses } from "../constants";

/**
 * Wizard project selection step.
 * When unlocked, exposes compact «افزودن پروژه» that reuses CreateProjectSheet
 * and auto-selects the newly created project.
 */
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
  const { data: projects = [], isLoading, error, refetch } = useListCompanyProjectsQuery(companyId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleCreated(project: Project) {
    void refetch();
    setIsCreateOpen(false);
    onSelect(project);
  }

  return (
    <GlassCard className="p-3 sm:p-6" data-tour="wizard-project-selector">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-ui-text-primary sm:text-base">
            انتخاب پروژه
          </h2>
          <p className="mt-0.5 text-[11px] text-ui-text-muted sm:text-xs">
            {isLocked
              ? "پروژه از گفتگوی مرتبط قفل شده است."
              : "یک پروژه موجود را انتخاب کنید یا پروژه جدید بسازید."}
          </p>
        </div>
        {!isLocked ? (
          <button
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-ui-primary/25 bg-ui-primary-soft px-2.5 text-[11px] font-bold text-ui-primary transition hover:bg-ui-surface-selected"
            data-tour="wizard-add-project-action"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            افزودن پروژه
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-ui-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال دریافت پروژه‌ها
        </div>
      ) : error ? (
        <p className="rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 text-sm leading-7 text-ui-danger">
          دریافت پروژه‌ها ناموفق بود. دوباره تلاش کنید.
        </p>
      ) : projects.length === 0 ? (
        <div
          className="space-y-3 rounded-lg border border-ui-warning/25 bg-ui-warning-soft p-3 sm:p-4"
          data-tour="wizard-project-empty"
        >
          <p className="text-sm leading-7 text-ui-warning">
            هنوز پروژه‌ای برای این شرکت ثبت نشده است. یک پروژه جدید بسازید تا ادامه دهید.
          </p>
          {!isLocked ? (
            <Button
              data-tour="wizard-add-project-empty-action"
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              افزودن پروژه
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <select
              className={inputClasses}
              data-tour="wizard-project-select"
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
              <p className="mt-2 text-xs text-ui-text-muted">
                این صورت‌بها به پروژه انتخاب‌شده متصل است و قابل تغییر نیست.
              </p>
            ) : null}
          </div>

          {selectedProject ? (
            <div className="rounded-lg border border-ui-primary/30 bg-ui-primary-soft p-3 sm:p-4">
              <p className="hidden text-sm font-bold text-ui-primary sm:block">
                {cleanDisplayText(selectedProject.name, "پروژه بدون نام")}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ui-text-muted sm:mt-1 sm:block">
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

      {isCreateOpen && !isLocked ? (
        <CreateProjectSheet
          companyId={companyId}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleCreated}
        />
      ) : null}
    </GlassCard>
  );
}
