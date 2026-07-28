import { useEffect, useState } from "react";
import { FileText, FolderKanban, Loader2, X } from "lucide-react";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import {
  type FinancialDocument,
  useLazyListProjectFinancialDocumentsQuery
} from "../financialDocuments/financialDocumentApi";
import { type Project, useListCompanyProjectsQuery } from "../projects/projectApi";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { GlassCard } from "../../shared/components/GlassCard";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { cleanDisplayText } from "../../shared/utils/formatters";

export type SelectedFinancialDocumentAttachment = {
  resourceId: number;
  label: string;
  documentNumber: string | null;
  projectName: string;
};

export function AttachFinancialDocumentModal({
  companyId,
  onClose,
  onSelect
}: {
  companyId: number;
  onClose: () => void;
  onSelect: (selection: SelectedFinancialDocumentAttachment) => void;
}) {
  const dispatch = useAppDispatch();
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } =
    useListCompanyProjectsQuery(companyId);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [fetchDocuments, { data: documentsData, isFetching: isLoadingDocuments, error: documentsError }] =
    useLazyListProjectFinancialDocumentsQuery();

  const documents = getListResults(documentsData);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }
    void fetchDocuments(selectedProject.id)
      .unwrap()
      .catch((error) => {
        dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
      });
  }, [dispatch, fetchDocuments, selectedProject]);

  function handlePick(document: FinancialDocument) {
    onSelect({
      resourceId: document.id,
      label: cleanDisplayText(document.title || document.report_title, "صورت‌بها"),
      documentNumber: document.document_number ?? null,
      projectName: cleanDisplayText(selectedProject?.name, "پروژه")
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <GlassCard
        className="max-h-[calc(100dvh-0.5rem)] w-full max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6 [scrollbar-width:thin]"
        dir="rtl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-200 light:text-emerald-700" />
            <div>
              <h2 className="text-lg font-black text-white light:text-slate-950">پیوست صورت‌بها</h2>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                یک سند موجود را برای ارجاع در پیام انتخاب کنید.
              </p>
            </div>
          </div>
          <button
            aria-label="بستن"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-rose-200 sm:h-8 sm:w-8 light:border-slate-200 light:text-slate-500"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoadingProjects ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت پروژه‌ها
          </div>
        ) : projectsError ? (
          <EmptyState
            description={getApiErrorMessage(projectsError)}
            icon={<X className="h-7 w-7" />}
            title="پروژه‌ها دریافت نشد"
          />
        ) : projects.length === 0 ? (
          <EmptyState
            description="ابتدا از بخش پروژه‌ها یک پروژه و صورت‌بها بسازید."
            icon={<FolderKanban className="h-7 w-7" />}
            title="پروژه‌ای وجود ندارد"
          />
        ) : selectedProject == null ? (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3 text-right transition hover:border-emerald-300/30 light:border-slate-200 light:bg-white"
                  onClick={() => setSelectedProject(project)}
                  type="button"
                >
                  <FolderKanban className="h-4 w-4 text-violet-200 light:text-violet-700" />
                  <span className="text-sm font-black text-white light:text-slate-950">
                    {cleanDisplayText(project.name, "پروژه بدون نام")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-200 light:text-slate-700">
                {cleanDisplayText(selectedProject.name, "پروژه")}
              </p>
              <Button onClick={() => setSelectedProject(null)} type="button" variant="secondary">
                تغییر پروژه
              </Button>
            </div>
            {isLoadingDocuments ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
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
              <EmptyState
                description="برای این پروژه هنوز صورت‌بهایی ثبت نشده است."
                icon={<FileText className="h-7 w-7" />}
                title="سندی یافت نشد"
              />
            ) : (
              <ul className="space-y-2">
                {documents.map((document) => (
                  <li key={document.id}>
                    <button
                      className="flex w-full flex-col rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3 text-right transition hover:border-emerald-300/30 light:border-slate-200 light:bg-white"
                      onClick={() => handlePick(document)}
                      type="button"
                    >
                      <span className="text-sm font-black text-white light:text-slate-950">
                        {cleanDisplayText(document.title || document.report_title, "صورت‌بها")}
                      </span>
                      <span className="mt-1 text-xs text-slate-400 light:text-slate-500">
                        {document.document_number
                          ? `شماره: ${document.document_number}`
                          : `وضعیت: ${document.status}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
