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
  useAddFinancialDocumentPricebookMutation,
  useCreateProjectFinancialDocumentMutation,
  useLockFinancialDocumentMutation,
  useRemoveFinancialDocumentPricebookMutation,
  useRetrieveFinancialDocumentQuery
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
import { type Project } from "../features/projects/projectApi";
import { useGetTokenWalletQuery } from "../features/wallet/walletApi";
import { formatDecimal } from "../shared/utils/formatters";

import { CurrentDocumentPanel } from "../features/costReports/components/CurrentDocumentPanel";
import { DocumentInfoSection } from "../features/costReports/components/DocumentInfoSection";
import { DocumentLinesModal } from "../features/costReports/components/DocumentLinesModal";
import { DocumentSummaryBox } from "../features/costReports/components/DocumentSummaryBox";
import { ItemDetailModal } from "../features/costReports/components/ItemDetailModal";
import { PricebookBrowserSection } from "../features/costReports/components/PricebookBrowserSection";
import { StarredItemModal } from "../features/costReports/components/StarredItemModal";
import { ProjectCoefficientPanel } from "../features/costReports/components/ProjectCoefficientPanel";
import { ProjectSelectorSection } from "../features/costReports/components/ProjectSelectorSection";

import { EmptyState } from "../shared/components/EmptyState";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { getListResults } from "../shared/utils/listResults";
import { classNames, linkButtonClasses } from "../shared/utils/classNames";
import { cleanDisplayText } from "../shared/utils/formatters";

import {
  builderSections,
  lockedBuilderSectionMessage
} from "../features/costReports/constants";
import {
  getInitialWizardForm,
  isFinancialDocumentLocked,
  matchesChapterFilter,
  omitEmpty,
  optionalDate
} from "../features/costReports/costReportUtils";
import {
  type DraftPricebookPick,
  formatDocumentPricebookRemoveError,
  formatPricebookEditionCreateError,
  formatPricebookSelectionLabel,
  listUsableEditionsForFamily,
  reconcileActiveDocumentPricebookId,
  resolveDocumentSelectedPricebooks,
  selectDefaultEditionForFamily,
  selectDefaultPricebookFamily,
  sortActivePricebookFamilies
} from "../features/costReports/pricebookFamilyYear";
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

  // If opened with an existing document, go straight to the browser.
  // If opened with a preselected project (no doc yet), start at the document step.
  // Otherwise start at project selector.
  const initialSection: BuilderSection = builderState?.existingDocument
    ? "pricebook"
    : builderState?.existingProject
    ? "document"
    : "project";

  const [step, setStep] = useState<"setup" | "browser">(
    builderState?.existingDocument ? "browser" : "setup"
  );
  const [activeSection, setActiveSection] = useState<BuilderSection>(initialSection);
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
  const [draftFamilyId, setDraftFamilyId] = useState<number | null>(null);
  const [draftEditionId, setDraftEditionId] = useState<number | null>(null);
  const [draftPicks, setDraftPicks] = useState<DraftPricebookPick[]>([]);
  const [activeDocumentPricebookId, setActiveDocumentPricebookId] = useState<number | null>(
    null
  );
  const [selectionActionError, setSelectionActionError] = useState<string | null>(null);
  const [isRemovingSelectionId, setIsRemovingSelectionId] = useState<number | null>(null);
  const isExistingDocument = Boolean(createdDocument);
  const documentLocked = isFinancialDocumentLocked(createdDocument);
  const canMutateSelections = !documentLocked;
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeChapterFilter, setActiveChapterFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedCoefficientSetId, setSelectedCoefficientSetId] = useState<number | null>(null);
  const [showLinesModal, setShowLinesModal] = useState(false);
  const [showStarredItemModal, setShowStarredItemModal] = useState(false);

  const dispatch = useAppDispatch();

  const { data: company } = useRetrieveCompanyQuery(parsedCompanyId, {
    skip: !hasValidCompanyId
  });
  const { data: tokenWallet } = useGetTokenWalletQuery();
  const {
    data: pricebooksData,
    error: pricebooksError,
    isLoading: isLoadingPricebooks
  } = useListPricebooksQuery();
  const pricebooks = getListResults<Pricebook>(pricebooksData);
  const families = useMemo(
    () => sortActivePricebookFamilies(pricebooks),
    [pricebooks]
  );

  const selectedFamily =
    selectDefaultPricebookFamily(families, draftFamilyId) ?? undefined;

  const {
    data: familyEditionsData,
    error: editionsError,
    isFetching: isFetchingFamilyEditions,
    isLoading: isLoadingFamilyEditions
  } = useListPricebookEditionsQuery(selectedFamily?.id ?? 0, {
    skip: !selectedFamily
  });

  const familyEditions = useMemo(
    () => getListResults<PricebookEdition>(familyEditionsData),
    [familyEditionsData]
  );

  const editions = useMemo(() => {
    if (!selectedFamily) return [];
    return listUsableEditionsForFamily(familyEditions, selectedFamily.id);
  }, [familyEditions, selectedFamily]);

  const isLoadingEditions =
    isLoadingFamilyEditions || (Boolean(selectedFamily) && isFetchingFamilyEditions);

  const selectedEdition = useMemo(() => {
    if (!selectedFamily) return undefined;
    if (
      draftEditionId != null &&
      editions.some((edition) => edition.id === draftEditionId)
    ) {
      return editions.find((edition) => edition.id === draftEditionId);
    }
    return selectDefaultEditionForFamily(editions, selectedFamily, draftEditionId);
  }, [draftEditionId, editions, selectedFamily]);

  useEffect(() => {
    if (!selectedFamily) return;
    setDraftFamilyId((current) =>
      current === selectedFamily.id ? current : selectedFamily.id
    );
    setDraftEditionId((current) => {
      if (current != null && editions.some((edition) => edition.id === current)) {
        return current;
      }
      return selectDefaultEditionForFamily(editions, selectedFamily)?.id ?? null;
    });
  }, [editions, selectedFamily]);

  const persistedSelections = useMemo(
    () => resolveDocumentSelectedPricebooks(createdDocument),
    [createdDocument]
  );

  useEffect(() => {
    setActiveDocumentPricebookId((current) =>
      reconcileActiveDocumentPricebookId(persistedSelections, current)
    );
  }, [persistedSelections]);

  const activeDocumentPricebook =
    persistedSelections.find((item) => item.id === activeDocumentPricebookId) ??
    persistedSelections[0] ??
    null;

  const activeEditionId =
    activeDocumentPricebook?.pricebook_edition_id ??
    createdDocument?.pricebook_edition_id ??
    null;

  const activeEditionYear = activeDocumentPricebook?.year;

  const {
    data: chaptersData,
    error: chaptersError,
    isLoading: isLoadingChapters
  } = useListPricebookChaptersQuery(activeEditionId ?? 0, {
    skip: activeEditionId == null
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
      editionId: activeEditionId ?? undefined,
      groupId: selectedGroupId ?? undefined,
      q: searchTerm.trim() || undefined
    },
    { skip: activeEditionId == null || !selectedChapterId }
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
      if (
        createdDocument?.coefficient_set_id &&
        coefficientSets.some((set) => set.id === createdDocument.coefficient_set_id)
      ) {
        return createdDocument.coefficient_set_id;
      }
      return (coefficientSets.find((set) => set.is_default) ?? coefficientSets[0]).id;
    });
  }, [coefficientSets, createdDocument?.coefficient_set_id]);

  const selectedCoefficientSet =
    coefficientSets.find((set) => set.id === selectedCoefficientSetId) ?? null;
  const isBuilderUnlocked = Boolean(createdDocument);
  const completedSections: Partial<Record<BuilderSection, boolean>> = {
    project: Boolean(createdProject),
    document: Boolean(createdDocument),
    pricebook: Boolean(createdDocument && (createdDocument.lines?.length ?? 0) > 0),
    coefficients: Boolean(selectedCoefficientSet),
    finalize: false
  };

  const [createDocument, createDocumentState] = useCreateProjectFinancialDocumentMutation();
  const [lockDocument] = useLockFinancialDocumentMutation();
  const [addDocumentPricebook, addDocumentPricebookState] =
    useAddFinancialDocumentPricebookMutation();
  const [removeDocumentPricebook] = useRemoveFinancialDocumentPricebookMutation();
  const { refetch: refetchDocument } = useRetrieveFinancialDocumentQuery(
    createdDocument?.id ?? 0,
    { skip: !createdDocument }
  );
  const isSubmitting = createDocumentState.isLoading;
  const isAddingSelection = addDocumentPricebookState.isLoading;

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

  function navigateBackToCompany(document?: FinancialDocument | null) {
    const returnGroupId = builderState?.returnToGroupId;
    const doc = document ?? createdDocument;
    navigate(`/companies/${parsedCompanyId}`, {
      state:
        doc && returnGroupId != null
          ? {
              focusSection: "messages",
              focusGroupId: returnGroupId,
              pendingFinancialDocumentAttachment: {
                documentId: doc.id,
                title: cleanDisplayText(doc.title || doc.report_title, "صورت‌بها"),
                documentNumber: doc.document_number ?? null
              }
            }
          : doc
            ? {
                focusSection: "messages",
                pendingFinancialDocumentAttachment: {
                  documentId: doc.id,
                  title: cleanDisplayText(doc.title || doc.report_title, "صورت‌بها"),
                  documentNumber: doc.document_number ?? null
                }
              }
            : returnGroupId != null
              ? { focusSection: "messages", focusGroupId: returnGroupId }
              : undefined
    });
  }

  function handleWizardBack() {
    const prev = getPrevSection(activeSection);
    if (prev) {
      // Skip locked project step when returning
      if (prev === "project" && builderState?.lockProject && builderState.existingProject) {
        navigateBackToCompany(createdDocument);
        return;
      }
      handleBuilderSectionSelect(prev);
    } else if (createdDocument) {
      navigateBackToCompany(createdDocument);
    } else {
      navigateBackToCompany(null);
    }
  }

  const canGoNext: boolean = (() => {
    if (activeSection === "project") return Boolean(createdProject);
    if (activeSection === "document") {
      if (createdDocument) return !isSubmitting;
      return (
        !isSubmitting &&
        form.document_title.trim().length > 0 &&
        draftPicks.length >= 1
      );
    }
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
      title:
        builderSections.find((section) => section.id === activeSection)?.title ??
        "افزودن صورت‌بها",
      companyName: cleanDisplayText(company?.name, "شرکت"),
      tokenBalanceLabel: tokenWallet ? formatDecimal(tokenWallet.balance) : "—",
      isLastStep,
      canGoNext,
      onNext: isLastStep ? null : () => {
        if (activeSection === "project") {
          handleProjectSelectorNext();
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
    tokenWallet,
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

  function updateField(field: keyof WizardFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearBrowserContext() {
    setSelectedChapterId(null);
    setSelectedGroupId(null);
    setSearchTerm("");
    setSelectedItemId(null);
    setActiveChapterFilter("all");
  }

  function handleActivePricebookChange(selectionId: number) {
    if (selectionId === activeDocumentPricebookId) return;
    setActiveDocumentPricebookId(selectionId);
    clearBrowserContext();
  }

  async function handleAddSelection() {
    if (!canMutateSelections || !selectedFamily || !selectedEdition) return;
    if (selectedEdition.year == null) {
      setSelectionActionError("سال فهرست‌بها نامعتبر است.");
      return;
    }
    setSelectionActionError(null);
    setFormError(null);

    if (createdDocument) {
      try {
        await addDocumentPricebook({
          documentId: createdDocument.id,
          body: { pricebook_edition_id: selectedEdition.id }
        }).unwrap();
        const refreshed = await refetchDocument().unwrap();
        setCreatedDocument(refreshed);
      } catch (error) {
        const message = formatDocumentPricebookRemoveError(
          error,
          getApiErrorMessage(error, "افزودن فهرست‌بها به صورت‌بها انجام نشد.")
        );
        setSelectionActionError(message);
        dispatch(addToast({ message, type: "error" }));
      }
      return;
    }

    if (draftPicks.some((pick) => pick.editionId === selectedEdition.id)) {
      setSelectionActionError("این فهرست‌بها قبلاً به فهرست اضافه شده است.");
      return;
    }

    setDraftPicks((current) => [
      ...current,
      {
        editionId: selectedEdition.id,
        familyTitleFa: selectedFamily.title_fa,
        year: selectedEdition.year as number
      }
    ]);
  }

  function handleRemoveDraftPick(editionId: number) {
    setDraftPicks((current) => current.filter((pick) => pick.editionId !== editionId));
    setSelectionActionError(null);
  }

  async function handleRemovePersistedSelection(selectionId: number) {
    if (!createdDocument || !canMutateSelections) return;
    setSelectionActionError(null);
    setIsRemovingSelectionId(selectionId);
    try {
      await removeDocumentPricebook({
        documentId: createdDocument.id,
        selectionId
      }).unwrap();
      const refreshed = await refetchDocument().unwrap();
      setCreatedDocument(refreshed);
      if (activeDocumentPricebookId === selectionId) {
        clearBrowserContext();
      }
    } catch (error) {
      const message = formatDocumentPricebookRemoveError(error);
      setSelectionActionError(message);
      dispatch(addToast({ message, type: "error" }));
    } finally {
      setIsRemovingSelectionId(null);
    }
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

  function handleProjectSelectorNext() {
    setFormError(null);
    if (!createdProject) {
      setFormError("ابتدا یک پروژه انتخاب کنید.");
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
      navigateBackToCompany(createdDocument);
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await doSubmit();
  }

  function handleFamilyChange(value: string) {
    if (!canMutateSelections) return;
    const nextFamilyId = Number(value);
    if (!Number.isInteger(nextFamilyId) || nextFamilyId <= 0) return;
    setDraftFamilyId(nextFamilyId);
    setDraftEditionId(null);
  }

  function handleEditionChange(value: string) {
    if (!canMutateSelections) return;
    const nextEditionId = Number(value);
    if (!Number.isInteger(nextEditionId) || nextEditionId <= 0) return;
    setDraftEditionId(nextEditionId);
  }

  function handleChapterSelect(chapter: PricebookChapter) {
    setSelectedChapterId(chapter.id);
    setSelectedGroupId(null);
    setSearchTerm("");
  }

  async function doSubmit() {
    setFormError(null);
    setSelectionActionError(null);

    if (!createdProject) {
      setFormError("ابتدا یک پروژه انتخاب کنید.");
      return;
    }

    if (createdDocument) {
      setDocumentSetupNotice(null);
      setStep("browser");
      setActiveSection("pricebook");
      return;
    }

    if (!form.document_title.trim()) {
      setFormError("عنوان صورت‌بها الزامی است.");
      return;
    }

    if (isLoadingPricebooks || pricebooksError || families.length === 0) {
      setFormError("فهرست‌بها هنوز بارگذاری نشده است. دوباره تلاش کنید.");
      return;
    }

    if (draftPicks.length === 0) {
      setFormError("حداقل یک فهرست‌بها را با «افزودن» به فهرست اضافه کنید.");
      return;
    }

    try {
      const document = await createDocument({
        projectId: createdProject.id,
        body: {
          document_type: "cost_report",
          document_number: omitEmpty(form.document_number),
          title: form.document_title.trim(),
          report_title: omitEmpty(form.report_title),
          document_date: optionalDate(form.document_date),
          period_start_on: optionalDate(form.period_start_on),
          period_end_on: optionalDate(form.period_end_on),
          pricebook_edition_ids: draftPicks.map((pick) => pick.editionId)
        }
      }).unwrap();

      setCreatedDocument(document);
      setDraftPicks([]);
      setDocumentSetupNotice(null);
      setStep("browser");
      setActiveSection("pricebook");
    } catch (error) {
      const message = formatPricebookEditionCreateError(
        error,
        getApiErrorMessage(error, "ایجاد صورت‌بها انجام نشد.")
      );
      setFormError(message);
      dispatch(addToast({ message, type: "error" }));
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
    <div className={classNames(
      "mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pt-3 sm:px-6 sm:pt-4 lg:min-h-full lg:px-6 lg:py-3 xl:px-8",
      activeSection !== "pricebook" && "pb-6 lg:pb-3"
    )}>
      <div className="min-w-0 space-y-3" dir="rtl">
        {step === "setup" ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              if (activeSection === "project") {
                event.preventDefault();
                handleProjectSelectorNext();
                return;
              }
              void handleSubmit(event);
            }}
          >
            {activeSection === "project" ? (
              <ProjectSelectorSection
                companyId={parsedCompanyId}
                isLocked={Boolean(builderState?.lockProject)}
                onSelect={(project) => {
                  setCreatedProject(project);
                  if (project) {
                    navigate(location.pathname, {
                      replace: true,
                      state: {
                        ...(builderState ?? {}),
                        existingProject: project,
                        lockProject: Boolean(builderState?.lockProject)
                      }
                    });
                  }
                }}
                selectedProject={createdProject}
              />
            ) : null}

            {activeSection === "document" ? (
                <DocumentInfoSection
                  canMutateSelections={canMutateSelections}
                  draftPicks={draftPicks}
                  editions={editions}
                  editionsError={editionsError}
                  families={families}
                  form={form}
                  formError={formError}
                  isAddingSelection={isAddingSelection}
                  isExistingDocument={isExistingDocument}
                  isLoadingEditions={isLoadingEditions}
                  isLoadingPricebooks={isLoadingPricebooks}
                  isRemovingSelectionId={isRemovingSelectionId}
                  onAddSelection={() => {
                    void handleAddSelection();
                  }}
                  onEditionChange={handleEditionChange}
                  onFamilyChange={handleFamilyChange}
                  onFieldChange={updateField}
                  onRemoveDraftPick={handleRemoveDraftPick}
                  onRemovePersistedSelection={(selectionId) => {
                    void handleRemovePersistedSelection(selectionId);
                  }}
                  persistedSelections={persistedSelections}
                  pricebooksError={pricebooksError}
                  selectedEdition={selectedEdition}
                  selectedFamily={selectedFamily}
                  selectionActionError={selectionActionError}
                />
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
                selectedEditionYear={activeEditionYear}
                setupNotice={documentSetupNotice}
              />
            ) : null}

            {activeSection === "coefficients" && createdProject ? (
              <ProjectCoefficientPanel
                chapters={chapters}
                coefficientSets={coefficientSets}
                currentDocument={createdDocument}
                isLoadingSets={isLoadingCoefficientSets}
                onDocumentUpdated={setCreatedDocument}
                onSelectedCoefficientSetIdChange={setSelectedCoefficientSetId}
                projectId={createdProject.id}
                selectedCoefficientSetId={selectedCoefficientSetId}
                setsError={coefficientSetsError}
              />
            ) : null}

            {activeSection === "pricebook" ? (
              <PricebookBrowserSection
                activeChapterFilter={activeChapterFilter}
                activePricebookLabel={
                  activeDocumentPricebook
                    ? formatPricebookSelectionLabel({
                        familyTitleFa: activeDocumentPricebook.family_title_fa,
                        year: activeDocumentPricebook.year
                      })
                    : null
                }
                activePricebookOptions={persistedSelections.map((selection) => ({
                  id: selection.id,
                  label: formatPricebookSelectionLabel({
                    familyTitleFa: selection.family_title_fa,
                    year: selection.year
                  })
                }))}
                activePricebookSelectionId={activeDocumentPricebookId}
                chaptersError={chaptersError}
                filteredChapters={filteredChapters}
                groups={groups}
                groupsError={groupsError}
                isFetchingItems={isFetchingItems}
                isLoadingChapters={isLoadingChapters}
                isLoadingGroups={isLoadingGroups}
                items={items}
                itemsError={itemsError}
                onActivePricebookChange={handleActivePricebookChange}
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
                summarySlot={
                  createdDocument ? (
                    <DocumentSummaryBox
                      document={createdDocument}
                      onOpenLines={() => setShowLinesModal(true)}
                      onOpenStarredItem={() => setShowStarredItemModal(true)}
                    />
                  ) : null
                }
              />
            ) : null}
          </div>
        )}
      </div>

      {selectedItemId ? (
        <ItemDetailModal
          coefficientSets={coefficientSets}
          document={createdDocument}
          documentPricebookId={
            activeDocumentPricebookId != null && activeDocumentPricebookId > 0
              ? activeDocumentPricebookId
              : null
          }
          itemId={selectedItemId}
          onSelectedCoefficientSetIdChange={setSelectedCoefficientSetId}
          onClose={() => setSelectedItemId(null)}
          onDocumentUpdated={(document) => {
            setCreatedDocument(document);
            setActiveDocumentPricebookId((current) =>
              reconcileActiveDocumentPricebookId(
                resolveDocumentSelectedPricebooks(document),
                current
              )
            );
          }}
          onToast={(msg, type = "info") =>
            dispatch(addToast({ message: msg, type }))
          }
          selectedCoefficientSetId={selectedCoefficientSetId}
        />
      ) : null}

      {showLinesModal && createdDocument ? (
        <DocumentLinesModal
          document={createdDocument}
          onClose={() => setShowLinesModal(false)}
          onDocumentUpdated={setCreatedDocument}
        />
      ) : null}

      {showStarredItemModal && createdDocument ? (
        <StarredItemModal
          document={createdDocument}
          onClose={() => setShowStarredItemModal(false)}
          onDocumentUpdated={setCreatedDocument}
          onToast={(msg, type = "info") =>
            dispatch(addToast({ message: msg, type }))
          }
        />
      ) : null}

    </div>
  );
}
