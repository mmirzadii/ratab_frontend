import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, FolderKanban, Loader2, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import {
  type FinancialDocument,
  useLazyListProjectFinancialDocumentsQuery
} from "../financialDocuments/financialDocumentApi";
import { type Project, useListCompanyProjectsQuery } from "../projects/projectApi";
import { CreateProjectSheet } from "../projects/CreateProjectSheet";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { GlassCard } from "../../shared/components/GlassCard";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { cleanDisplayText } from "../../shared/utils/formatters";
import type { CostReportBuilderState } from "../costReports/types";

export type SelectedFinancialDocumentAttachment = {
  resourceId: number;
  label: string;
  documentNumber: string | null;
  projectName: string;
};

type Step = "select-project" | "browse-documents" | "create-project";
type DocIntent = "browse" | "create";

function formatDocumentStatus(status: string | null | undefined): string {
  switch (status) {
    case "draft":
      return "پیش‌نویس";
    case "calculated":
      return "محاسبه‌شده";
    case "locked":
      return "قفل‌شده";
    case "sent":
      return "ارسال‌شده";
    case "under_review":
      return "در بررسی";
    case "approved":
      return "تأییدشده";
    case "rejected":
      return "ردشده";
    case "archived":
      return "بایگانی";
    default:
      return status ? String(status) : "";
  }
}

function formatDocumentDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Single reusable financial-document attachment selector.
 * Lists existing project documents directly; «افزودن صورت‌بها» starts creation.
 * Project-linked chats lock the project; public/custom require explicit project selection.
 */
export function FinancialDocumentActionModal({
  companyId,
  groupId,
  lockedProject = null,
  onClose,
  onSelect
}: {
  companyId: number;
  groupId: number;
  lockedProject?: Project | null;
  onClose: () => void;
  onSelect: (selection: SelectedFinancialDocumentAttachment) => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects
  } = useListCompanyProjectsQuery(companyId);
  const projectLocked = lockedProject != null;
  const [step, setStep] = useState<Step>(() =>
    lockedProject ? "browse-documents" : "select-project"
  );
  const [docIntent, setDocIntent] = useState<DocIntent>("browse");
  const [selectedProject, setSelectedProject] = useState<Project | null>(lockedProject);
  const [projectQuery, setProjectQuery] = useState("");
  const [fetchDocuments, { data: documentsData, isFetching: isLoadingDocuments, error: documentsError }] =
    useLazyListProjectFinancialDocumentsQuery();

  const documents = getListResults(documentsData);

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => {
      const haystack = [project.name, project.project_code, project.contract_number, project.employer_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, projectQuery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (step === "create-project") {
          setStep("select-project");
          return;
        }
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, step]);

  useEffect(() => {
    if (lockedProject) {
      setSelectedProject(lockedProject);
      setStep("browse-documents");
    }
  }, [lockedProject]);

  useEffect(() => {
    if (step !== "browse-documents" || !selectedProject) {
      return;
    }
    void fetchDocuments(selectedProject.id)
      .unwrap()
      .catch((error) => {
        dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
      });
  }, [dispatch, fetchDocuments, selectedProject, step]);

  function handlePick(document: FinancialDocument) {
    onSelect({
      resourceId: document.id,
      label: cleanDisplayText(document.title || document.report_title, "صورت‌بها"),
      documentNumber: document.document_number ?? null,
      projectName: cleanDisplayText(selectedProject?.name, "پروژه")
    });
    onClose();
  }

  function openCreateWizard(project: Project) {
    const state: CostReportBuilderState = {
      existingProject: project,
      returnToGroupId: groupId,
      lockProject: projectLocked || Boolean(lockedProject)
    };
    onClose();
    navigate(`/companies/${companyId}/cost-reports/new`, { state });
  }

  function continueWithProject(project: Project, intent: DocIntent) {
    setSelectedProject(project);
    setValidationHint(null);
    if (intent === "create") {
      openCreateWizard(project);
      return;
    }
    setStep("browse-documents");
  }

  const [validationHint, setValidationHint] = useState<string | null>(null);

  function handleAddFinancialDocument() {
    setDocIntent("create");
    setValidationHint(null);
    if (selectedProject && (projectLocked || step === "browse-documents")) {
      openCreateWizard(selectedProject);
      return;
    }
    if (projectLocked && lockedProject) {
      openCreateWizard(lockedProject);
      return;
    }
    if (projects.length === 0 && !isLoadingProjects) {
      setStep("create-project");
      return;
    }
    if (!selectedProject && step === "select-project") {
      setValidationHint("ابتدا یک پروژه انتخاب کنید.");
      return;
    }
    setStep("select-project");
  }

  function handleProjectCreated(project: Project) {
    void refetchProjects();
    continueWithProject(project, docIntent);
  }

  const headerProjectName = selectedProject
    ? cleanDisplayText(selectedProject.name, "پروژه")
    : projectLocked && lockedProject
      ? cleanDisplayText(lockedProject.name, "پروژه")
      : null;

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const sheet = (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/60 backdrop-blur-sm md:items-center md:justify-center md:p-4"
      data-tour="financial-document-action-modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={overlayRef}
    >
      <GlassCard
        className="flex h-dvh w-full flex-col overflow-hidden p-0 md:h-auto md:max-h-[calc(100dvh-2rem)] md:max-w-lg md:rounded-lg"
        dir="rtl"
      >
        {step === "create-project" ? (
          <div className="overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin]">
            <CreateProjectSheet
              companyId={companyId}
              nested
              onClose={() => setStep("select-project")}
              onSuccess={handleProjectCreated}
            />
          </div>
        ) : (
          <>
            <div
              className="flex shrink-0 items-start justify-between gap-2 border-b border-ui-border-subtle px-3 py-3 sm:px-4"
              data-tour="financial-document-selector-header"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-ui-primary" />
                  <h2 className="truncate text-base font-black text-ui-text-primary">
                    صورت‌بهاها
                  </h2>
                </div>
                {headerProjectName ? (
                  <p className="mt-1 truncate text-[11px] text-ui-text-muted">
                    {headerProjectName}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-ui-text-muted">
                    ابتدا یک پروژه انتخاب کنید
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  className="flex h-8 items-center gap-1 rounded-lg border border-ui-primary/25 bg-ui-primary-soft px-2.5 text-[11px] font-bold text-ui-primary transition hover:bg-ui-surface-selected"
                  data-tour="add-financial-document-action"
                  onClick={handleAddFinancialDocument}
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  افزودن صورت‌بها
                </button>
                <button
                  aria-label="بستن"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-ui-border-subtle text-ui-text-muted transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200"
                  onClick={onClose}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 [scrollbar-width:thin]">
              {step === "select-project" ? (
                <div className="space-y-3" data-tour="financial-document-project-select">
                  <p className="text-sm font-bold text-ui-text-secondary">انتخاب پروژه</p>

                  <label className="relative block">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ui-text-muted" />
                    <input
                      className="h-10 w-full rounded-lg border border-ui-border-subtle bg-ui-surface pr-9 pl-3 text-xs text-ui-text-primary outline-none placeholder:text-ui-text-muted focus:border-ui-primary/30"
                      onChange={(e) => setProjectQuery(e.target.value)}
                      placeholder="جستجوی پروژه…"
                      value={projectQuery}
                    />
                  </label>

                  {validationHint ? (
                    <p className="rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100">
                      {validationHint}
                    </p>
                  ) : null}

                  {isLoadingProjects ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-ui-text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال دریافت پروژه‌ها
                    </div>
                  ) : projectsError ? (
                    <EmptyState
                      description={getApiErrorMessage(projectsError)}
                      icon={<X className="h-7 w-7" />}
                      title="پروژه‌ها دریافت نشد"
                    />
                  ) : filteredProjects.length === 0 ? (
                    <div className="space-y-3 py-6 text-center">
                      <FolderKanban className="mx-auto h-7 w-7 text-ui-text-muted" />
                      <p className="text-sm text-ui-text-secondary">پروژه‌ای وجود ندارد.</p>
                      <Button
                        onClick={() => setStep("create-project")}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                        ایجاد پروژه جدید
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {filteredProjects.map((project) => (
                        <li key={project.id}>
                          <button
                            className="flex w-full items-center gap-3 rounded-xl border border-ui-border-subtle bg-ui-surface px-3 py-3 text-right transition hover:border-ui-primary/30"
                            onClick={() => continueWithProject(project, docIntent)}
                            type="button"
                          >
                            <FolderKanban className="h-4 w-4 text-ui-text-secondary" />
                            <span className="text-sm font-black text-ui-text-primary">
                              {cleanDisplayText(project.name, "پروژه بدون نام")}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {step === "browse-documents" && selectedProject ? (
                <div className="space-y-3" data-tour="financial-document-list">
                  {!projectLocked ? (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          setDocIntent("browse");
                          setStep("select-project");
                        }}
                        type="button"
                        variant="secondary"
                      >
                        تغییر پروژه
                      </Button>
                    </div>
                  ) : null}

                  {isLoadingDocuments ? (
                    <div
                      className="flex items-center justify-center gap-2 py-10 text-sm text-ui-text-muted"
                      data-tour="financial-document-list-loading"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال دریافت صورت‌بهاها
                    </div>
                  ) : documentsError ? (
                    <EmptyState
                      description={getApiErrorMessage(documentsError)}
                      icon={<X className="h-7 w-7" />}
                      title="صورت‌بهاها دریافت نشد"
                    />
                  ) : documents.length === 0 ? (
                    <div
                      className="space-y-3 py-8 text-center"
                      data-tour="financial-document-list-empty"
                    >
                      <FileText className="mx-auto h-7 w-7 text-ui-text-muted" />
                      <p className="text-sm text-ui-text-secondary">
                        هنوز صورت‌بهایی برای این پروژه ساخته نشده است.
                      </p>
                      <Button
                        data-tour="empty-list-add-financial-document"
                        onClick={handleAddFinancialDocument}
                        type="button"
                        variant="secondary"
                      >
                        <Plus className="h-4 w-4" />
                        افزودن صورت‌بها
                      </Button>
                    </div>
                  ) : (
                    <ul className="max-h-[min(28rem,55dvh)] space-y-2 overflow-y-auto [scrollbar-width:thin]">
                      {documents.map((document) => {
                        const statusLabel = formatDocumentStatus(document.status);
                        const dateLabel = formatDocumentDate(
                          document.document_date || document.updated_at || document.created_at
                        );
                        return (
                          <li key={document.id}>
                            <div className="flex items-center gap-2 rounded-xl border border-ui-border-subtle bg-ui-surface px-3 py-2.5">
                              <button
                                className="min-w-0 flex-1 text-right transition hover:opacity-90"
                                onClick={() => handlePick(document)}
                                type="button"
                              >
                                <span className="block truncate text-sm font-black text-ui-text-primary">
                                  {cleanDisplayText(
                                    document.title || document.report_title,
                                    "صورت‌بها"
                                  )}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-ui-text-muted">
                                  {[
                                    document.document_number
                                      ? `شماره ${document.document_number}`
                                      : null,
                                    statusLabel,
                                    dateLabel
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </button>
                              <button
                                className="shrink-0 rounded-lg border border-ui-primary/30 bg-ui-primary-soft px-2.5 py-1.5 text-[11px] font-bold text-ui-primary transition hover:bg-ui-primary-soft"
                                data-tour="select-financial-document"
                                onClick={() => handlePick(document)}
                                type="button"
                              >
                                انتخاب
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );

  return createPortal(sheet, document.body);
}

/** @deprecated Prefer FinancialDocumentActionModal */
export const AttachFinancialDocumentModal = FinancialDocumentActionModal;
