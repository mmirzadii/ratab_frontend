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
  useListPricebookEditionsForFamiliesQuery,
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
  matchesChapterFilter,
  omitEmpty,
  optionalDate,
  parsePositiveInteger,
  getDeprecatedConfiguredPriceSetId
} from "../features/costReports/costReportUtils";
import {
  editionBelongsToFamily,
  formatPricebookEditionCreateError,
  listUsableEditionsForFamily,
  priceSetBelongsToEdition,
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
  const isDevPriceSetConfirmed = false;
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(
    builderState?.existingDocument?.pricebook_edition_id ?? null
  );
  const isExistingDocument = Boolean(createdDocument);
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
  const familyIds = useMemo(() => families.map((family) => family.id), [families]);

  const selectedFamily =
    selectDefaultPricebookFamily(families, selectedFamilyId) ?? undefined;

  // New documents: editions for the selected family only (avoids cross-family races).
  const {
    data: familyEditionsData,
    error: familyEditionsError,
    isFetching: isFetchingFamilyEditions,
    isLoading: isLoadingFamilyEditions
  } = useListPricebookEditionsQuery(selectedFamily?.id ?? 0, {
    skip: !selectedFamily || isExistingDocument
  });

  // Existing documents: resolve the immutable saved edition across families.
  const {
    data: allEditionsData,
    error: allEditionsError,
    isLoading: isLoadingAllEditions
  } = useListPricebookEditionsForFamiliesQuery(familyIds, {
    skip: !isExistingDocument || familyIds.length === 0
  });

  const familyEditions = useMemo(
    () => getListResults<PricebookEdition>(familyEditionsData),
    [familyEditionsData]
  );
  const allEditions = useMemo(
    () => getListResults<PricebookEdition>(allEditionsData),
    [allEditionsData]
  );

  const savedEdition = useMemo(() => {
    if (!createdDocument?.pricebook_edition_id) return undefined;
    const editionId = createdDocument.pricebook_edition_id;
    return (
      allEditions.find((edition) => edition.id === editionId) ??
      familyEditions.find((edition) => edition.id === editionId)
    );
  }, [allEditions, createdDocument?.pricebook_edition_id, familyEditions]);

  const editions = useMemo(() => {
    if (isExistingDocument) {
      return savedEdition ? [savedEdition] : [];
    }
    if (!selectedFamily) return [];
    // Guard stale out-of-order responses: only keep editions for the current family.
    return listUsableEditionsForFamily(familyEditions, selectedFamily.id);
  }, [familyEditions, isExistingDocument, savedEdition, selectedFamily]);

  const editionsError = isExistingDocument ? allEditionsError : familyEditionsError;
  const isLoadingEditions = isExistingDocument
    ? isLoadingAllEditions
    : isLoadingFamilyEditions || (Boolean(selectedFamily) && isFetchingFamilyEditions);

  const selectedEdition = useMemo(() => {
    if (isExistingDocument) {
      return savedEdition;
    }
    if (!selectedFamily) return undefined;
    if (
      selectedEditionId != null &&
      editions.some((edition) => edition.id === selectedEditionId)
    ) {
      return editions.find((edition) => edition.id === selectedEditionId);
    }
    return selectDefaultEditionForFamily(editions, selectedFamily, selectedEditionId);
  }, [
    editions,
    isExistingDocument,
    savedEdition,
    selectedEditionId,
    selectedFamily
  ]);

  const selectedActivePriceSet = selectedEdition?.active_price_set ?? null;

  // Sync explicit selection state once defaults resolve (new documents only).
  useEffect(() => {
    if (isExistingDocument) {
      if (savedEdition) {
        setSelectedFamilyId(savedEdition.pricebook_id);
        setSelectedEditionId(savedEdition.id);
      }
      return;
    }
    if (!selectedFamily) return;
    setSelectedFamilyId((current) =>
      current === selectedFamily.id ? current : selectedFamily.id
    );
    setSelectedEditionId((current) => {
      if (
        current != null &&
        editions.some((edition) => edition.id === current)
      ) {
        return current;
      }
      return selectDefaultEditionForFamily(editions, selectedFamily)?.id ?? null;
    });
  }, [editions, isExistingDocument, savedEdition, selectedFamily]);

  const activeEditionId =
    selectedEdition?.id ?? createdDocument?.pricebook_edition_id ?? null;

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
  const isSubmitting = createDocumentState.isLoading;

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
    if (isExistingDocument) return;
    const nextFamilyId = Number(value);
    if (!Number.isInteger(nextFamilyId) || nextFamilyId <= 0) return;
    setSelectedFamilyId(nextFamilyId);
    setSelectedEditionId(null);
    setSelectedChapterId(null);
    setSelectedGroupId(null);
  }

  function handleEditionChange(value: string) {
    if (isExistingDocument) return;
    const nextEditionId = Number(value);
    if (!Number.isInteger(nextEditionId) || nextEditionId <= 0) return;
    setSelectedEditionId(nextEditionId);
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

    if (!createdProject) {
      setFormError("ابتدا یک پروژه انتخاب کنید.");
      return;
    }

    if (!form.document_title.trim()) {
      setFormError("عنوان صورت‌بها الزامی است.");
      return;
    }

    if (isLoadingPricebooks || pricebooksError || families.length === 0 || !selectedFamily) {
      setFormError("فهرست‌بها هنوز بارگذاری نشده است. دوباره تلاش کنید.");
      return;
    }

    if (isLoadingEditions || editionsError || editions.length === 0 || !selectedEdition) {
      setFormError(
        editions.length === 0 && selectedFamily
          ? "برای این نوع فهرست‌بها سال فعالی وجود ندارد."
          : "سال فهرست‌بها را انتخاب کنید."
      );
      return;
    }

    if (!editionBelongsToFamily(selectedEdition, selectedFamily.id)) {
      setFormError("سال انتخاب‌شده با نوع فهرست‌بها هم‌خوان نیست.");
      return;
    }

    if (selectedEdition.year == null) {
      setFormError("سال فهرست‌بها نامعتبر است.");
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

    if (!priceSetId) {
      setFormError("برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.");
      return;
    }

    if (
      selectedActivePriceSet &&
      !priceSetBelongsToEdition(selectedEdition, priceSetId)
    ) {
      setFormError("مجموعه قیمت با نسخه فهرست‌بهای انتخاب‌شده هم‌خوان نیست.");
      return;
    }

    try {
      const document =
        createdDocument ??
        (await createDocument({
          projectId: createdProject.id,
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

      setCreatedDocument(document);
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
                  editions={editions}
                  editionsError={editionsError}
                  families={families}
                  form={form}
                  formError={formError}
                  isExistingDocument={isExistingDocument}
                  isLoadingEditions={isLoadingEditions}
                  isLoadingPricebooks={isLoadingPricebooks}
                  onEditionChange={handleEditionChange}
                  onFamilyChange={handleFamilyChange}
                  onFieldChange={updateField}
                  pricebooksError={pricebooksError}
                  savedEdition={savedEdition}
                  selectedActivePriceSet={selectedActivePriceSet}
                  selectedEdition={selectedEdition}
                  selectedFamily={selectedFamily}
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
                selectedEditionYear={selectedEdition?.year}
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
