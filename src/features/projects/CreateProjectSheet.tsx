import { type FormEvent, useEffect, useState } from "react";
import { FolderKanban, Loader2, X } from "lucide-react";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { buildProjectCreateBody } from "../companies/groupKinds";
import { type Project, useCreateCompanyProjectMutation } from "../projects/projectApi";
import { Button } from "../../shared/components/Button";
import { GlassCard } from "../../shared/components/GlassCard";
import { getApiErrorMessage } from "../../shared/utils/apiError";

const panelInputClasses =
  "h-11 w-full rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30 focus:bg-ui-surface/65 sm:h-12 sm:px-4";

/** Focused project-creation sheet reused by conversation create and financial-document flow. */
export function CreateProjectSheet({
  companyId,
  onClose,
  onSuccess,
  nested = false
}: {
  companyId: number;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  /** When true, render as inner panel (parent already provides overlay). */
  nested?: boolean;
}) {
  const dispatch = useAppDispatch();
  const [createProject, { isLoading }] = useCreateCompanyProjectMutation();
  const [form, setForm] = useState({
    name: "",
    project_code: "",
    contract_number: "",
    employer_name: ""
  });
  const [includeAllCompanyMembersInGroup, setIncludeAllCompanyMembersInGroup] = useState(true);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const body = buildProjectCreateBody({
      name: form.name.trim(),
      project_code: form.project_code.trim() || undefined,
      contract_number: form.contract_number.trim() || undefined,
      employer_name: form.employer_name.trim() || undefined,
      includeAllCompanyMembersInGroup
    });

    try {
      const newProject = await createProject({ companyId, body }).unwrap();
      dispatch(addToast({ message: "پروژه با موفقیت ایجاد شد.", type: "success" }));
      onSuccess(newProject);
    } catch (submitError) {
      dispatch(addToast({ message: getApiErrorMessage(submitError), type: "error" }));
    }
  }

  useEffect(() => {
    if (nested) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nested, onClose]);

  const body = (
    <div className={nested ? "space-y-3" : undefined} data-tour="create-project-sheet">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-5 w-5 text-ui-primary" />
          <h2 className="text-lg font-black text-ui-text-primary">ایجاد پروژه جدید</h2>
        </div>
        <button
          aria-label="بستن"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ui-border-subtle text-ui-text-muted transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200 sm:h-8 sm:w-8"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ui-text-secondary">
            نام پروژه <span className="text-rose-400">*</span>
          </span>
          <input
            autoFocus
            className={panelInputClasses}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="مثلاً پروژه ساختمانی نمونه"
            required
            value={form.name}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ui-text-secondary">کد پروژه</span>
            <input
              className={panelInputClasses}
              onChange={(e) => updateField("project_code", e.target.value)}
              placeholder="اختیاری"
              value={form.project_code}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-ui-text-secondary">شماره قرارداد</span>
            <input
              className={panelInputClasses}
              onChange={(e) => updateField("contract_number", e.target.value)}
              placeholder="اختیاری"
              value={form.contract_number}
            />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-bold text-ui-text-secondary">کارفرما</span>
          <input
            className={panelInputClasses}
            onChange={(e) => updateField("employer_name", e.target.value)}
            placeholder="اختیاری"
            value={form.employer_name}
          />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-ui-border-subtle bg-ui-surface p-3">
          <input
            checked={includeAllCompanyMembersInGroup}
            className="mt-1 h-4 w-4 accent-ui-primary"
            onChange={(event) => setIncludeAllCompanyMembersInGroup(event.target.checked)}
            type="checkbox"
          />
          <span className="space-y-1">
            <span className="block text-sm font-bold text-ui-text-primary">
              همه اعضای شرکت عضو گروه این پروژه شوند
            </span>
            <span className="block text-xs leading-6 text-ui-text-muted">
              با برداشتن این گزینه، در ابتدا فقط شما عضو گروه پروژه خواهید بود.
            </span>
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            انصراف
          </Button>
          <Button disabled={isLoading || !form.name.trim()} type="submit">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderKanban className="h-4 w-4" />}
            ایجاد پروژه
          </Button>
        </div>
      </form>
    </div>
  );

  if (nested) {
    return body;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassCard
        className="max-h-[calc(100dvh-0.5rem)] w-full max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6 [scrollbar-width:thin]"
        dir="rtl"
      >
        {body}
      </GlassCard>
    </div>
  );
}
