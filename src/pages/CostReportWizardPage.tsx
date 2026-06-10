import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import { useAppShell } from "../app/appShellContext";
import { addToast } from "../features/ui/uiSlice";
import { useRetrieveCompanyQuery } from "../features/companies/companyApi";
import { useListProjectCoefficientSetsQuery } from "../features/coefficients/coefficientApi";
import {
  type FinancialDocument,
  useCreateProjectFinancialDocumentMutation,
  useLockFinancialDocumentMutation
} from "../features/financialDocuments/financialDocumentApi";
import {
  type Pricebook,
  type PricebookChapter,
  type PricebookEdition,
  type PricebookGroup,
  type PricebookItemList,
  useListPricebookChaptersQuery,
  useListPricebookEditionsQuery,
  useListPricebookGroupsQuery,
  useListPricebookItemsQuery,
  useListPricebooksQuery
} from "../features/pricebooks/pricebookApi";
import { type Project, useCreateCompanyProjectMutation } from "../features/projects/projectApi";

import { BuilderSectionNav } from "../features/costReports/components/BuilderSectionNav";
import { CurrentDocumentPanel } from "../features/costReports/components/CurrentDocumentPanel";
import { DocumentInfoSection } from "../features/costReports/components/DocumentInfoSection";
import { ItemDetailModal } from "../features/costReports/components/ItemDetailModal";
import { PricebookBrowserSection } from "../features/costReports/components/PricebookBrowserSection";
import { ProjectCoefficientPanel } from "../features/costReports/components/ProjectCoefficientPanel";
import { ProjectInfoSection } from "../features/costReports/components/ProjectInfoSection";

import { EmptyState } from "../shared/components/EmptyState";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { getListResults } from "../shared/utils/listResults";
import { linkButtonClasses } from "../shared/utils/classNames";
import { cleanDisplayText } from "../shared/utils/formatters";

import {
  builderSections,
  lockedBuilderSectionMessage
} from "../features/costReports/constants";
import {
  getDefaultEdition,
  getInitialWizardForm,
  matchesChapterFilter,
  omitEmpty,
  optionalDate,
  parsePositiveInteger,
  getDeprecatedConfiguredPriceSetId
} from "../features/costReports/costReportUtils";
import type {
  BuilderSection,
  CostReportBuilderState,
  WizardFormState
} from "../features/costReports/types";

export function CostReportWizardPage() {
  const { companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const builderState = (location.state as CostReportBuilderState | null) ?? null;
  const parsedCompanyId = Number(companyId);
  const hasValidCompanyId = Number.isInteger(parsedCompanyId) && parsedCompanyId > 0;

  const [step, setStep] = useState<"setup" | "browser">(
    builderState?.existingDocument ? "browser" : "setup"
  );
  const [activeSection, setActiveSection] = useState<BuilderSection>(
    builderState?.existingDocument ? "pricebook" : "project"
  );
  const [form, setForm] = useState<WizardFormState>(() =>
    getInitialWizardForm(builderState)
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<Project | null>(
    builderState?.existingProject ?? null
  );
  const [createdDocument, setCreatedDocument] = useState<FinancialDocument | null>(
    builderState?.existingDocument ?? null
  );
  const [documentSetupNotice, setDocumentSetupNotice] = useState<string | null>(null);
  const [isAdvancedDevOpen, setIsAdvancedDevOpen] = useState(false);
  const [isDevPriceSetConfirmed, setIsDevPriceSetConfirmed] = useState(false);
  const [selectedPricebookId, setSelectedPricebookId] = useState<number | null>(null);
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeChapterFilter, setActiveChapterFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedCoefficientSetId, setSelectedCoefficientSetId] = useState<number | null>(null);

  const dispatch = useAppDispatch();

  const { data: company } = useRetrieveCompanyQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const {
    data: pricebooksData,
    error: pricebooksError,
    isLoading: isLoadingPricebooks
  } = useListPricebooksQuery();
  const pricebooks = getListResults<Pricebook>(pricebooksData);
  const selectedPricebook =
    pricebooks.find((pricebook) => pricebook.id === selectedPricebookId) ??
    pricebooks.find((pricebook) => pricebook.code === "ABN1404") ??
    pricebooks.find((pricebook) => pricebook.is_active) ??
    pricebooks[0];

  const {
    data: editionsData,
    error: editionsError,
    isLoading: isLoadingEditions
  } = useListPricebookEditionsQuery(selectedPricebook?.id ?? 0, {
    skip: !selectedPricebook
  });
  const editions = getListResults<PricebookEdition>(editionsData);
  const selectedEdition =
    editions.find((edition) => edition.id === selectedEditionId) ??
    getDefaultEdition(editions);
  const selectedActivePriceSet = selectedEdition?.active_price_set ?? null;

  const {
    data: chaptersData,
    error: chaptersError,
    isLoading: isLoadingChapters
  } = useListPricebookChaptersQuery(selectedEdition?.id ?? 0, {
    skip: !selectedEdition
  });
  const chapters = useMemo(
    () => getListResults<PricebookChapter>(chaptersData),
    [chaptersData]
  );
  const filteredChapters = useMemo(
    () => chapters.filter((chapter) => matchesChapterFilter(chapter, activeChapterFilter)),
    [activeChapterFilter, chapters]
  );
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups
  } = useListPricebookGroupsQuery(selectedChapterId ?? 0, {
    skip: !selectedChapterId
  });
  const groups = getListResults<PricebookGroup>(groupsData);

  const {
    data: itemsData,
    error: itemsError,
    isFetching: isFetchingItems
  } = useListPricebookItemsQuery(
    {
      chapterId: selectedChapterId ?? undefined,
      editionId: selectedEdition?.id,
      groupId: selectedGroupId ?? undefined,
      q: searchTerm.trim() || undefined
    },
    { skip: !selectedEdition || !selectedChapterId }
  );
  const items = getListResults<PricebookItemList>(itemsData);

  const {
    data: coefficientSets = [],
    error: coefficientSetsError,
    isLoading: isLoadingCoefficientSets
  } = useListProjectCoefficientSetsQuery(createdProject?.id ?? 0, {
    skip: !createdProject
  });

  useEffect(() => {
    setSelectedCoefficientSetId((current) => {
      if (coefficientSets.length === 0) {
        return current === null ? current : null;
      }

      if (current && coefficientSets.some((set) => set.id === current)) {
        return current;
      }

      return (coefficientSets.find((set) => set.is_default) ?? coefficientSets[0]).id;
    });
  }, [coefficientSets]);

  const selectedCoefficientSet =
    coefficientSets.find((set) => set.id === selectedCoefficientSetId) ?? null;
  const isBuilderUnlocked = Boolean(createdDocument);
  const completedSections: Partial<Record<BuilderSection, boolean>> = {
    project: Boolean(createdProject || form.project_name.trim()),
    document: Boolean(createdDocument),
    pricebook: Boolean(createdDocument && (createdDocument.lines?.length ?? 0) > 0),
    coefficients: Boolean(selectedCoefficientSet),
    finalize: false
  };

  const [createProject, createProjectState] = useCreateCompanyProjectMutation();
  const [createDocument, createDocumentState] = useCreateProjectFinancialDocumentMutation();
  const [lockDocument] = useLockFinancialDocumentMutation();
  const isSubmitting = createProjectState.isLoading || createDocumentState.isLoading;

  const isLastStep = activeSection === "finalize";

  const builderOrder: BuilderSection[] = [
    "project",
    "document",
    "pricebook",
    "coefficients",
    "finalize"
  ];

  function getPrevSection(current: BuilderSection): BuilderSection | null {
    const idx = builderOrder.indexOf(current);
    return idx > 0 ? builderOrder[idx - 1] : null;
  }

  function getNextSection(current: BuilderSection): BuilderSection | null {
    const idx = builderOrder.indexOf(current);
    return idx >= 0 && idx < builderOrder.length - 1 ? builderOrder[idx + 1] : null;
  }

  function handleWizardBack() {
    const prev = getPrevSection(activeSection);
    if (prev) {
      handleBuilderSectionSelect(prev);
    } else if (createdDocument) {
      navigate(`/companies/${parsedCompanyId}`, {
        state: {
          pendingCostReportAttachment: {
            document: createdDocument,
            project: createdProject,
            title: cleanDisplayText(createdDocument.title || createdDocument.report_title, "صورت‌بها در حال ویرایش"),
            description: "در حال ویرایش"
          }
        }
      });
    } else {
      navigate(`/companies/${parsedCompanyId}`);
    }
  }

  const canGoNext: boolean = (() => {
    if (activeSection === "project") return form.project_name.trim().length > 0;
    if (activeSection === "document")
      return !isSubmitting && form.document_title.trim().length > 0 && Boolean(selectedEdition);
    if (activeSection === "finalize") return false;
    return isBuilderUnlocked;
  })();

  const { setSecondaryNav, setSecondaryNavVariant, setCompanyCtx, setWizardCtx } = useAppShell();

  useEffect(() => {
    setSecondaryNavVariant("violet");
    setSecondaryNav(
      builderSections.map((section) => {
        const enabled =
          section.id === "project" || section.id === "document" || isBuilderUnlocked;
        const isDone = completedSections[section.id] === true;
        const Icon = isDone ? CheckCircle2 : section.icon;
        return {
          id: section.id,
          label: section.shortLabel,
          icon: Icon,
          isActive: activeSection === section.id,
          disabled: !enabled,
          onClick: enabled ? () => handleBuilderSectionSelect(section.id) : undefined
        };
      })
    );

    if (company) {
      setCompanyCtx({
        id: company.id,
        name: cleanDisplayText(company.name, "شرکت بدون نام"),
        isActive: company.is_active
      });
    }

    setWizardCtx({
      title: "افزودن صورت‌بها",
      companyName: cleanDisplayText(company?.name, "شرکت"),
      tokenBalanceLabel: "—",
      isLastStep,
      canGoNext,
      onNext: isLastStep ? null : () => {
        if (activeSection === "project") {
          handleProjectInfoNext();
        } else if (activeSection === "document") {
          void doSubmit();
        } else {
          const next = getNextSection(activeSection);
          if (next) handleBuilderSectionSelect(next);
        }
      },
      onBack: handleWizardBack,
      onFinalize: handleFinalizeDraft
    });

    return () => {
      setSecondaryNav(null);
      setSecondaryNavVariant("emerald");
      setCompanyCtx(null);
      setWizardCtx(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    company,
    activeSection,
    isBuilderUnlocked,
    createdDocument,
    createdProject,
    selectedCoefficientSet,
    isLastStep,
    canGoNext,
    parsedCompanyId,
    setSecondaryNav,
    setSecondaryNavVariant,
    setCompanyCtx,
    setWizardCtx
  ]);

  const deprecatedConfiguredPriceSetId = getDeprecatedConfiguredPriceSetId();

  function updateField(field: keyof WizardFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleBuilderSectionSelect(section: BuilderSection) {
    const isEnabled =
      section === "project" || section === "document" || isBuilderUnlocked;
    if (!isEnabled) {
      setFormError(lockedBuilderSectionMessage);
      return;
    }

    setFormError(null);
    setStep(section === "project" || section === "document" ? "setup" : "browser");
    setActiveSection(section);
  }

  function handleProjectInfoNext() {
    setFormError(null);

    if (!form.project_name.trim()) {
      setFormError("نام پروژه را وارد کنید.");
      return;
    }

    setActiveSection("document");
    setStep("setup");
  }

  async function handleFinalizeDraft() {
    if (!createdDocument) {
      dispatch(addToast({ message: "ابتدا یک ردیف به صورت‌بها اضافه کنید.", type: "info" }));
      return;
    }

    try {
      await lockDocument(createdDocument.id).unwrap();
      dispatch(addToast({ message: "صورت‌بها با موفقیت نهایی شد.", type: "success" }));
      navigate(`/companies/${parsedCompanyId}`);
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await doSubmit();
  }

  function handlePricebookChange(value: string) {
    setSelectedPricebookId(Number(value));
    setSelectedEditionId(null);
    setSelectedChapterId(null);
    setSelectedGroupId(null);
  }

  function handleEditionChange(value: string) {
    setSelectedEditionId(Number(value));
    setSelectedChapterId(null);
    setSelectedGroupId(null);
  }

  function handleChapterSelect(chapter: PricebookChapter) {
    setSelectedChapterId(chapter.id);
    setSelectedGroupId(null);
    setSearchTerm("");
  }

  async function doSubmit() {
    setFormError(null);

    if (!form.project_name.trim()) {
      setFormError("نام پروژه الزامی است.");
      return;
    }

    if (!form.document_title.trim()) {
      setFormError("عنوان صورت‌بها الزامی است.");
      return;
    }

    if (isLoadingPricebooks || pricebooksError || pricebooks.length === 0 || !selectedPricebook) {
      setFormError("فهرست‌بها هنوز بارگذاری نشده است. دوباره تلاش کنید.");
      return;
    }

    if (isLoadingEditions || editionsError || editions.length === 0 || !selectedEdition) {
      setFormError("سال فهرست‌بها را انتخاب کنید.");
      return;
    }

    const manualPriceSetId = parsePositiveInteger(form.price_set_id);
    if (form.price_set_id.trim() && !manualPriceSetId) {
      setFormError("شناسه فنی مجموعه قیمت باید یک عدد مثبت باشد.");
      return;
    }

    if (!selectedActivePriceSet && manualPriceSetId && !isDevPriceSetConfirmed) {
      setFormError(
        "برای استفاده از تنظیمات پیشرفته توسعه، تایید استفاده از شناسه فنی لازم است."
      );
      return;
    }

    if (
      !selectedActivePriceSet &&
      isDevPriceSetConfirmed &&
      !manualPriceSetId &&
      !deprecatedConfiguredPriceSetId
    ) {
      setFormError("تنظیم آزمایشی معتبر وارد یا پیکربندی نشده است.");
      return;
    }

    const fallbackPriceSetId = isDevPriceSetConfirmed
      ? (manualPriceSetId ?? deprecatedConfiguredPriceSetId)
      : null;
    const priceSetId = selectedActivePriceSet?.id ?? fallbackPriceSetId;
    const baseYear = parsePositiveInteger(form.base_year) ?? 1404;

    if (!priceSetId) {
      setFormError("برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.");
      return;
    }

    try {
      const project =
        createdProject ??
        (await createProject({
          companyId: parsedCompanyId,
          body: {
            project_code: omitEmpty(form.project_code),
            name: form.project_name.trim(),
            contract_number: omitEmpty(form.contract_number),
            employer_name: omitEmpty(form.employer_name),
            consultant_name: omitEmpty(form.consultant_name),
            contractor_name: omitEmpty(form.contractor_name),
            executive_agency_name: omitEmpty(form.executive_agency_name),
            base_year: baseYear,
            status: "draft",
            starts_on: optionalDate(form.starts_on),
            ends_on: optionalDate(form.ends_on),
            description: omitEmpty(form.description)
          }
        }).unwrap());

      const document =
        createdDocument ??
        (await createDocument({
          projectId: project.id,
          body: {
            document_type: "cost_report",
            document_number: omitEmpty(form.document_number),
            title: form.document_title.trim(),
            report_title: omitEmpty(form.report_title),
            document_date: optionalDate(form.document_date),
            period_start_on: optionalDate(form.period_start_on),
            period_end_on: optionalDate(form.period_end_on),
            pricebook_edition_id: selectedEdition.id,
            price_set_id: priceSetId
          }
        }).unwrap());

      setCreatedProject(project);
      setCreatedDocument(document);
      setDocumentSetupNotice(null);
      setStep("browser");
      setActiveSection("pricebook");
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  if (!hasValidCompanyId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <EmptyState
          action={
            <Link className={linkButtonClasses} to="/companies">
              بازگشت به شرکت‌ها
            </Link>
          }
          description="شناسه شرکت در مسیر معتبر نیست."
          icon={<XCircle className="h-7 w-7" />}
          title="مسیر شرکت نامعتبر است"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-10 pt-3 sm:px-6 sm:pt-5 lg:px-8">
      {/* Mobile-only step nav with prev/next buttons (desktop handled by SecondaryNav + ContextHeader) */}
      <div className="lg:hidden" dir="rtl">
        <BuilderSectionNav
          activeSection={activeSection}
          completedSections={completedSections}
          isUnlocked={isBuilderUnlocked}
          onSelect={handleBuilderSectionSelect}
        />
      </div>

      <div className="min-w-0 space-y-5" dir="rtl">
        {step === "setup" ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              if (activeSection === "project") {
                event.preventDefault();
                handleProjectInfoNext();
                return;
              }
              void handleSubmit(event);
            }}
          >
            {activeSection === "project" ? (
              <>
                <h2 className="text-lg font-black text-white light:text-slate-950">اطلاعات پروژه</h2>
                <ProjectInfoSection
                  form={form}
                  onFieldChange={updateField}
                />
              </>
            ) : null}

            {activeSection === "document" ? (
              <>
                <h2 className="text-lg font-black text-white light:text-slate-950">اطلاعات صورت‌بها</h2>
                <DocumentInfoSection
                  editions={editions}
                  editionsError={editionsError}
                  form={form}
                  formError={formError}
                  isAdvancedDevOpen={isAdvancedDevOpen}
                  isDevPriceSetConfirmed={isDevPriceSetConfirmed}
                  isLoadingEditions={isLoadingEditions}
                  isLoadingPricebooks={isLoadingPricebooks}
                  onAdvancedDevOpenChange={setIsAdvancedDevOpen}
                  onDevPriceSetConfirmedChange={setIsDevPriceSetConfirmed}
                  onEditionChange={handleEditionChange}
                  onFieldChange={updateField}
                  onPricebookChange={handlePricebookChange}
                  pricebooks={pricebooks}
                  pricebooksError={pricebooksError}
                  selectedActivePriceSet={selectedActivePriceSet}
                  selectedEdition={selectedEdition}
                  selectedPricebook={selectedPricebook}
                />
              </>
            ) : null}
            <button aria-hidden="true" className="sr-only" tabIndex={-1} type="submit" />
          </form>
        ) : (
          <div className="space-y-5">
            {activeSection === "finalize" ? (
              <CurrentDocumentPanel
                document={createdDocument}
                onDocumentUpdated={setCreatedDocument}
                project={createdProject}
                selectedCoefficientSetName={selectedCoefficientSet?.name ?? null}
                selectedEditionYear={selectedEdition?.year}
                setupNotice={documentSetupNotice}
              />
            ) : null}

            {activeSection === "coefficients" && createdProject ? (
              <ProjectCoefficientPanel
                chapters={chapters}
                coefficientSets={coefficientSets}
                isLoadingSets={isLoadingCoefficientSets}
                onSelectedCoefficientSetIdChange={setSelectedCoefficientSetId}
                projectId={createdProject.id}
                selectedChapterId={selectedChapterId}
                selectedCoefficientSetId={selectedCoefficientSetId}
                setsError={coefficientSetsError}
              />
            ) : null}

            {activeSection === "pricebook" ? (
              <PricebookBrowserSection
                activeChapterFilter={activeChapterFilter}
                chaptersError={chaptersError}
                filteredChapters={filteredChapters}
                groups={groups}
                groupsError={groupsError}
                isFetchingItems={isFetchingItems}
                isLoadingChapters={isLoadingChapters}
                isLoadingGroups={isLoadingGroups}
                items={items}
                itemsError={itemsError}
                onChapterFilterChange={(filterId) => {
                  setActiveChapterFilter(filterId);
                  setSelectedChapterId(null);
                  setSelectedGroupId(null);
                }}
                onChapterSelect={handleChapterSelect}
                onGroupSelect={setSelectedGroupId}
                onItemSelect={setSelectedItemId}
                onSearchTermChange={setSearchTerm}
                searchTerm={searchTerm}
                selectedChapter={selectedChapter}
                selectedChapterId={selectedChapterId}
                selectedGroupId={selectedGroupId}
              />
            ) : null}
          </div>
        )}
      </div>

      {selectedItemId ? (
        <ItemDetailModal
          coefficientSets={coefficientSets}
          document={createdDocument}
          itemId={selectedItemId}
          onSelectedCoefficientSetIdChange={setSelectedCoefficientSetId}
          onClose={() => setSelectedItemId(null)}
          onDocumentUpdated={setCreatedDocument}
          onToast={(msg, type = "info") =>
            dispatch(addToast({ message: msg, type }))
          }
          selectedCoefficientSetId={selectedCoefficientSetId}
        />
      ) : null}
    </div>
  );
}
