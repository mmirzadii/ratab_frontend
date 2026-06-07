import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Layers3,
  Lock,
  Loader2,
  Pencil,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  X,
  XCircle
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useRetrieveCompanyQuery } from "../features/companies/companyApi";
import {
  type ProjectCoefficientSet,
  type ProjectCoefficientValue,
  type ScopeEnum,
  useCreateCoefficientValueMutation,
  useCreateProjectCoefficientSetMutation,
  useDeleteCoefficientValueMutation,
  useListCoefficientValuesQuery,
  useListProjectCoefficientSetsQuery,
  useUpdateCoefficientValueMutation
} from "../features/coefficients/coefficientApi";
import {
  type FinancialDocument,
  type FinancialDocumentExport,
  type FinancialDocumentLine,
  useCreateFinancialDocumentExportMutation,
  useCreateFinancialDocumentLineMutation,
  useCreateProjectFinancialDocumentMutation,
  useDeleteFinancialDocumentLineMutation,
  useDownloadFinancialDocumentExportMutation,
  useLockFinancialDocumentMutation,
  useRecalculateFinancialDocumentMutation,
  useLazyRetrieveFinancialDocumentPreviewQuery,
  useUpdateFinancialDocumentLineMutation
} from "../features/financialDocuments/financialDocumentApi";
import {
  type Pricebook,
  type PricebookChapter,
  type PricebookEdition,
  type PricebookGroup,
  type PricebookCalculateInputRequest,
  type PricebookCalculateResponse,
  type PricebookItemDetail,
  type PricebookItemList,
  useCalculatePricebookItemMutation,
  useListPricebookChaptersQuery,
  useListPricebookEditionsQuery,
  useListPricebookGroupsQuery,
  useListPricebookItemsQuery,
  useListPricebooksQuery,
  useRetrievePricebookItemQuery
} from "../features/pricebooks/pricebookApi";
import { type Project, useCreateCompanyProjectMutation } from "../features/projects/projectApi";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames } from "../shared/utils/classNames";
import { formatMoneyAmount } from "../shared/utils/formatters";
import { normalizeNumberInput, normalizeRowCode } from "../shared/utils/numberText";

type WizardStep = "setup" | "browser";

type WizardFormState = {
  project_code: string;
  project_name: string;
  contract_number: string;
  employer_name: string;
  consultant_name: string;
  contractor_name: string;
  executive_agency_name: string;
  base_year: string;
  starts_on: string;
  ends_on: string;
  description: string;
  document_number: string;
  document_title: string;
  report_title: string;
  document_date: string;
  period_start_on: string;
  period_end_on: string;
  price_set_id: string;
};

const initialForm: WizardFormState = {
  project_code: "",
  project_name: "",
  contract_number: "",
  employer_name: "",
  consultant_name: "",
  contractor_name: "",
  executive_agency_name: "",
  base_year: "1404",
  starts_on: "",
  ends_on: "",
  description: "",
  document_number: "",
  document_title: "",
  report_title: "",
  document_date: "",
  period_start_on: "",
  period_end_on: "",
  price_set_id: ""
};

const chapterFilters = [
  { id: "all", label: "همه فصل‌ها" },
  { id: "01-09", label: "زیرساخت و سازه", min: 1, max: 9 },
  { id: "10-19", label: "معماری و فلزی", min: 10, max: 19 },
  { id: "20-29", label: "نازک‌کاری و مصالح", min: 20, max: 29 },
  { id: "30-39", label: "تکمیلی", min: 30, max: 39 },
  { id: "40-49", label: "مصالح پای کار", min: 40, max: 49 },
  { id: "90-99", label: "تجهیز کارگاه", min: 90, max: 99 }
] as const;

const coefficientKeyOptions = [
  { id: "regional", label: "ضریب منطقه" },
  { id: "overhead", label: "ضریب بالاسری" },
  { id: "floor", label: "ضریب طبقات" },
  { id: "proposal", label: "ضریب پیشنهادی" },
  { id: "custom_1", label: "ضریب سفارشی ۱" },
  { id: "custom_2", label: "ضریب سفارشی ۲" }
] as const;

const coefficientScopeOptions = [
  { id: "project", label: "کل پروژه" },
  { id: "chapter", label: "فصل" },
  { id: "row", label: "ردیف" }
] as const;

type CoefficientKey = (typeof coefficientKeyOptions)[number]["id"];
type CoefficientScope = (typeof coefficientScopeOptions)[number]["id"];

type CoefficientValueFormState = {
  coefficient_key: CoefficientKey;
  scope: CoefficientScope;
  chapter_id: string;
  row_id: string;
  label_fa: string;
  multiplier: string;
  is_active: boolean;
};

const initialCoefficientValueForm: CoefficientValueFormState = {
  coefficient_key: "overhead",
  scope: "project",
  chapter_id: "",
  row_id: "",
  label_fa: "ضریب بالاسری",
  multiplier: "1",
  is_active: true
};

const inputClasses =
  "h-12 w-full rounded-lg border border-white/10 bg-slate-950/45 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

const textareaClasses =
  "min-h-24 w-full resize-y rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-slate-950/65 light:border-slate-200 light:bg-white light:text-slate-950 light:placeholder:text-slate-400";

const linkButtonClasses =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800";

function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object" && data && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  }

  return "در ارتباط با سرور خطایی رخ داد. لطفاً دوباره تلاش کنید.";
}

function omitEmpty(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalDate(value: string) {
  const trimmed = normalizeNumberInput(value);
  return trimmed ? trimmed : undefined;
}

function parsePositiveInteger(value: string) {
  const normalized = normalizeNumberInput(value);
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getDeprecatedConfiguredPriceSetId() {
  return parsePositiveInteger(import.meta.env.VITE_DEFAULT_PRICE_SET_ID ?? "");
}

function getChapterNumber(chapterCode: string) {
  const normalized = normalizeRowCode(chapterCode);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesChapterFilter(chapter: PricebookChapter, filterId: string) {
  if (filterId === "all") {
    return true;
  }

  const filter = chapterFilters.find((item) => item.id === filterId);
  const chapterNumber = getChapterNumber(chapter.chapter_code);

  if (!filter || chapterNumber === null || !("min" in filter) || !("max" in filter)) {
    return false;
  }

  return chapterNumber >= filter.min && chapterNumber <= filter.max;
}

function normalizeQuantityValue(value: string) {
  return normalizeNumberInput(value).replace(/[٬,]/g, "").replace(/٫/g, ".");
}

function isPositiveDecimal(value: string) {
  return /^\d+(\.\d+)?$/.test(value) && !/^0+(\.0+)?$/.test(value);
}

function getCoefficientKeyLabel(key: string) {
  return coefficientKeyOptions.find((item) => item.id === key)?.label ?? key;
}

function getCoefficientScopeLabel(scope: string | undefined) {
  return coefficientScopeOptions.find((item) => item.id === scope)?.label ?? scope ?? "کل پروژه";
}

function hasManualUnitPrice(item: PricebookItemDetail) {
  return (
    item.unit_price === null ||
    item.unit_price === "" ||
    item.rows.some(
      (row) =>
        row.requires_manual_unit_price || row.unit_price === null || row.unit_price === ""
    )
  );
}

function getManualPriceValidationMessage(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (
      typeof data === "object" &&
      data &&
      "requires_manual_unit_price" in data &&
      (data as { requires_manual_unit_price?: unknown }).requires_manual_unit_price === true
    ) {
      const detail = (data as { detail?: unknown }).detail;
      return typeof detail === "string"
        ? detail
        : "این آیتم نیازمند قیمت دستی است و محاسبه قیمت دستی در این نسخه پشتیبانی نمی‌شود.";
    }
  }

  return getApiErrorMessage(error);
}

function formatJsonPreview(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return JSON.stringify(value, null, 2);
}

function getDefaultEdition(editions: PricebookEdition[]) {
  return (
    editions.find((edition) => edition.year === 1404) ??
    [...editions].sort((first, second) => second.year - first.year)[0]
  );
}

function getListResults<T>(data: { results?: readonly T[] } | readonly T[] | T | undefined): T[] {
  if (Array.isArray(data)) {
    return [...data];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  if ("results" in data) {
    return [...((data as { results?: readonly T[] }).results ?? [])];
  }

  return [data as T];
}

type DocumentTotals = {
  coefficientAmount: string | null;
  lineCount: number;
  pricebookAmount: string | null;
  totalAmount: string | null;
};

function getSnapshotString(snapshot: unknown, keys: string[]) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const record = snapshot as Record<string, unknown>;
  const value = keys.map((key) => record[key]).find((item) => item !== undefined && item !== null);

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return null;
}

function getDocumentTotals(document: FinancialDocument | null): DocumentTotals {
  const snapshot = document?.totals_snapshot_json;

  return {
    coefficientAmount: getSnapshotString(snapshot, [
      "coefficient_amount",
      "coefficient_total_amount"
    ]),
    lineCount:
      Number(getSnapshotString(snapshot, ["line_count"])) ||
      document?.lines.length ||
      0,
    pricebookAmount: getSnapshotString(snapshot, [
      "pricebook_amount",
      "base_amount",
      "raw_total_amount"
    ]),
    totalAmount: getSnapshotString(snapshot, ["total_amount", "final_total_amount"])
  };
}

function isFinancialDocumentLocked(document: FinancialDocument | null) {
  return document?.status === "locked" || Boolean(document?.locked_at);
}

function getDocumentStatusLabel(status: FinancialDocument["status"] | undefined) {
  if (status === "locked") {
    return "قفل‌شده";
  }

  if (status === "calculated") {
    return "محاسبه‌شده";
  }

  if (status === "draft") {
    return "پیش‌نویس";
  }

  return status ?? "نامشخص";
}

function getDocumentStatusTone(status: FinancialDocument["status"] | undefined) {
  if (status === "locked") {
    return "violet";
  }

  if (status === "calculated") {
    return "emerald";
  }

  if (status === "draft") {
    return "amber";
  }

  return "slate";
}

function ItemDetailModal({
  coefficientSets,
  document,
  itemId,
  onSelectedCoefficientSetIdChange,
  onDocumentUpdated,
  onClose,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  itemId: number;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  onClose: () => void;
  selectedCoefficientSetId: number | null;
}) {
  const { data: item, error, isLoading } = useRetrievePricebookItemQuery(itemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-slate-950 shadow-2xl light:border-slate-200 light:bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/95 p-5 light:border-slate-200 light:bg-white/95">
          <div>
            <p className="text-xs font-bold text-emerald-300">پوسته آماده فاز ۶</p>
            <h2 className="mt-1 text-xl font-black text-white light:text-slate-950">
              {item?.short_name_fa ?? "جزئیات آیتم"}
            </h2>
          </div>
          <button
            aria-label="بستن"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
              در حال دریافت جزئیات آیتم
            </div>
          ) : null}

          {error ? (
            <EmptyState
              description={getApiErrorMessage(error)}
              icon={<XCircle className="h-7 w-7" />}
              title="دریافت جزئیات آیتم ناموفق بود"
            />
          ) : null}

          {item ? (
            <ItemDetailContent
              coefficientSets={coefficientSets}
              document={document}
              item={item}
              onSelectedCoefficientSetIdChange={onSelectedCoefficientSetIdChange}
              onDocumentUpdated={onDocumentUpdated}
              selectedCoefficientSetId={selectedCoefficientSetId}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ItemDetailContent({
  coefficientSets,
  document,
  item,
  onSelectedCoefficientSetIdChange,
  onDocumentUpdated,
  selectedCoefficientSetId
}: {
  coefficientSets: ProjectCoefficientSet[];
  document: FinancialDocument | null;
  item: PricebookItemDetail;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  onDocumentUpdated: (document: FinancialDocument) => void;
  selectedCoefficientSetId: number | null;
}) {
  const [quantity, setQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<PricebookCalculateResponse | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);
  const [lineSuccess, setLineSuccess] = useState<string | null>(null);
  const [calculatePricebookItem, calculateState] = useCalculatePricebookItemMutation();
  const [createFinancialDocumentLine, createLineState] = useCreateFinancialDocumentLineMutation();
  const [recalculateFinancialDocument, recalculateState] = useRecalculateFinancialDocumentMutation();
  const requiresManualPrice = hasManualUnitPrice(item);
  const documentLocked = isFinancialDocumentLocked(document);
  const manualRows = item.rows.filter(
    (row) => row.requires_manual_unit_price || row.unit_price === null || row.unit_price === ""
  );

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuantityError(null);
    setCalculationError(null);
    setLineError(null);
    setLineSuccess(null);
    setCalculation(null);

    if (requiresManualPrice) {
      setCalculationError("محاسبه قیمت ستاره‌دار در این نسخه پشتیبانی نمی‌شود.");
      return;
    }

    const normalizedQuantity = normalizeQuantityValue(quantity);
    if (!isPositiveDecimal(normalizedQuantity)) {
      setQuantityError("مقدار باید یک عدد مثبت باشد.");
      return;
    }

    try {
      const calculateBody: PricebookCalculateInputRequest = {
        quantity: normalizedQuantity
      };

      if (selectedCoefficientSetId) {
        calculateBody.coefficient_set_id = selectedCoefficientSetId;
      }

      const result = await calculatePricebookItem({
        itemId: item.id,
        body: calculateBody
      }).unwrap();
      setQuantity(normalizedQuantity);
      setCalculation(result);
    } catch (error) {
      setCalculationError(getManualPriceValidationMessage(error));
    }
  }

  async function handleAddLine() {
    setLineError(null);
    setLineSuccess(null);

    if (!calculation) {
      setLineError("ابتدا آیتم را محاسبه کنید.");
      return;
    }

    if (requiresManualPrice || calculation.requires_manual_unit_price) {
      setLineError("آیتم‌های دارای قیمت ستاره‌دار در این نسخه به صورت‌بها اضافه نمی‌شوند.");
      return;
    }

    if (!document) {
      setLineError("سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید.");
      return;
    }

    if (documentLocked) {
      setLineError("این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد.");
      return;
    }

    try {
      await createFinancialDocumentLine({
        documentId: document.id,
        body: {
          pricebook_item_id: item.id,
          quantity: calculation.quantity
        }
      }).unwrap();
      const updatedDocument = await recalculateFinancialDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setLineSuccess("آیتم به صورت‌بها اضافه شد.");
    } catch (error) {
      setLineError(getManualPriceValidationMessage(error));
    }
  }

  const addLineDisabledReason = !calculation
    ? "بعد از محاسبه موفق می‌توانید آیتم را به صورت‌بها اضافه کنید."
    : requiresManualPrice || calculation.requires_manual_unit_price
      ? "آیتم‌های دارای قیمت ستاره‌دار در این نسخه به صورت‌بها اضافه نمی‌شوند."
      : !document
        ? "سند صورت‌بها آماده نیست. به مرحله قبل برگردید و دوباره تلاش کنید."
        : documentLocked
          ? "این صورت‌بها قفل شده و امکان افزودن خط جدید ندارد."
          : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <InfoBox label="کلید آیتم" value={item.item_key} />
        <InfoBox label="واحد" value={item.unit} />
        <InfoBox label="قیمت واحد" value={formatMoneyAmount(item.unit_price)} />
        <InfoBox label="وضعیت قیمت" value={requiresManualPrice ? "نیازمند قیمت دستی" : "قیمت رسمی"} />
      </div>

      {requiresManualPrice ? (
        <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
          این آیتم یا یکی از ردیف‌های آن قیمت رسمی ندارد. رتب هرگز قیمت خالی را صفر فرض نمی‌کند؛
          محاسبه قیمت دستی در فاز بعدی با پیام روشن انجام می‌شود.
        </div>
      ) : null}

      <section>
        <h3 className="text-base font-black text-white light:text-slate-950">ردیف‌های فهرست‌بها</h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-white/10 light:border-slate-200">
          <div className="grid grid-cols-[110px_1fr_110px_150px] bg-white/7 px-4 py-3 text-xs font-bold text-slate-300 light:bg-slate-50 light:text-slate-600">
            <span>کد ردیف</span>
            <span>شرح</span>
            <span>واحد</span>
            <span>قیمت</span>
          </div>
          {item.rows.map((row) => (
            <div
              className="grid grid-cols-[110px_1fr_110px_150px] gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-200 light:border-slate-200 light:text-slate-700"
              key={row.id}
            >
              <span className="font-mono text-emerald-200 light:text-emerald-700">
                {row.row_code}
              </span>
              <span>{row.title_fa || row.short_title_fa}</span>
              <span>{row.unit}</span>
              <span>{row.requires_manual_unit_price ? "قیمت دستی" : formatMoneyAmount(row.unit_price)}</span>
            </div>
          ))}
        </div>
      </section>

      <NotesSection notes={item.requirements} title="requirments" />
      <NotesSection notes={item.footnotes} title="پانوشت‌ها" />

      <label className="block space-y-2 rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
        <span className="text-sm font-bold text-slate-200 light:text-slate-700">
          مجموعه ضرایب برای محاسبه
        </span>
        <select
          className={inputClasses}
          onChange={(event) =>
            onSelectedCoefficientSetIdChange(
              event.target.value ? Number(event.target.value) : null
            )
          }
          value={selectedCoefficientSetId ?? ""}
        >
          <option value="">بدون ضریب</option>
          {coefficientSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
              {set.is_default ? " - پیش‌فرض" : ""}
            </option>
          ))}
        </select>
        {coefficientSets.length === 0 ? (
          <span className="text-xs leading-6 text-slate-400 light:text-slate-500">
            برای محاسبه با ضریب، ابتدا در بخش ضرایب پروژه مجموعه بسازید.
          </span>
        ) : null}
      </label>

      <CalculationSection
        addLineDisabledReason={addLineDisabledReason}
        calculation={calculation}
        calculationError={calculationError}
        isCalculating={calculateState.isLoading}
        manualRows={manualRows}
        onCalculate={handleCalculate}
        quantity={quantity}
        quantityError={quantityError}
        requiresManualPrice={requiresManualPrice}
        isAddingLine={createLineState.isLoading || recalculateState.isLoading}
        lineError={lineError}
        lineSuccess={lineSuccess}
        onAddLine={handleAddLine}
        canAddLine={!addLineDisabledReason}
        setQuantity={setQuantity}
      />
    </div>
  );
}

function CalculationSection({
  addLineDisabledReason,
  canAddLine,
  calculation,
  calculationError,
  isAddingLine,
  isCalculating,
  lineError,
  lineSuccess,
  manualRows,
  onAddLine,
  onCalculate,
  quantity,
  quantityError,
  requiresManualPrice,
  setQuantity
}: {
  addLineDisabledReason: string | null;
  canAddLine: boolean;
  calculation: PricebookCalculateResponse | null;
  calculationError: string | null;
  isAddingLine: boolean;
  isCalculating: boolean;
  lineError: string | null;
  lineSuccess: string | null;
  manualRows: PricebookItemDetail["rows"];
  onAddLine: () => void;
  onCalculate: (event: FormEvent<HTMLFormElement>) => void;
  quantity: string;
  quantityError: string | null;
  requiresManualPrice: boolean;
  setQuantity: (value: string) => void;
}) {
  const calculationInputJson = formatJsonPreview(calculation?.calculation_input);
  const calculationOutputJson = formatJsonPreview(calculation?.calculation_output);

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 light:bg-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black text-white light:text-slate-950">
            <Calculator className="h-4 w-4 text-emerald-200 light:text-emerald-700" />
            محاسبه آیتم
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            مقدار برای محاسبه رسمی ارسال می‌شود و مبالغ فقط از پاسخ محاسبه نمایش داده می‌شوند.
          </p>
        </div>
        <StatusBadge tone={requiresManualPrice ? "amber" : "emerald"}>
          {requiresManualPrice ? "نیازمند قیمت ستاره‌دار" : "آماده محاسبه"}
        </StatusBadge>
      </div>

      {requiresManualPrice ? (
        <div className="mt-4 space-y-3 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            <p>
              این آیتم قیمت رسمی کامل ندارد. رتب قیمت خالی را صفر فرض نمی‌کند و ثبت یا محاسبه قیمت
              ستاره‌دار در این نسخه پشتیبانی نمی‌شود.
            </p>
          </div>
          {manualRows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {manualRows.map((row) => (
                <span
                  className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 font-mono text-xs"
                  key={row.id}
                >
                  {row.row_code}
                </span>
              ))}
            </div>
          ) : null}
          <label className="block space-y-2">
            <span className="text-xs font-bold">قیمت ستاره‌دار</span>
            <input
              className={classNames(inputClasses, "cursor-not-allowed opacity-60")}
              disabled
              placeholder="در فاز آینده از کاربر دریافت می‌شود"
            />
          </label>
        </div>
      ) : null}

      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={onCalculate}>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-200 light:text-slate-700">مقدار</span>
          <input
            className={classNames(inputClasses, "text-left")}
            dir="ltr"
            inputMode="decimal"
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="1"
            value={quantity}
          />
        </label>
        <Button
          className="self-end"
          disabled={requiresManualPrice || isCalculating}
          type="submit"
        >
          {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          محاسبه
        </Button>
      </form>

      {quantityError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {quantityError}
        </p>
      ) : null}

      {calculationError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {calculationError}
        </p>
      ) : null}

      {calculation ? (
        <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-200 light:bg-white">
          <div className="grid gap-3 sm:grid-cols-4">
            <InfoBox label="کد ردیف" value={calculation.row_code} />
            <InfoBox label="بهای واحد" value={formatMoneyAmount(calculation.unit_price)} />
            <InfoBox label="مقدار" value={`${calculation.quantity} ${calculation.unit}`} />
            <InfoBox label="قیمت دستی" value={calculation.requires_manual_unit_price ? "بله" : "خیر"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox label="مبلغ پایه" value={formatMoneyAmount(calculation.base_amount)} />
            <InfoBox label="مبلغ ضرایب" value={formatMoneyAmount(calculation.coefficient_amount)} />
            <InfoBox label="مبلغ کل" value={formatMoneyAmount(calculation.total_amount)} />
          </div>
          {calculation.applied_coefficients.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <p className="text-xs font-bold text-slate-400 light:text-slate-500">ضرایب اعمال‌شده</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {calculation.applied_coefficients.map((coefficient) => (
                  <span
                    className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100 light:text-violet-800"
                    key={`${coefficient.coefficient_key}-${coefficient.scope}-${coefficient.coefficient_value_id}`}
                  >
                    {coefficient.label_fa}: {coefficient.multiplier}، اثر{" "}
                    {formatMoneyAmount(coefficient.effect_amount)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {calculationInputJson || calculationOutputJson ? (
            <details className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <summary className="cursor-pointer text-sm font-bold text-slate-100 light:text-slate-900">
                جزئیات فنی محاسبه
              </summary>
              {calculationInputJson ? (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950/80 p-3 text-left text-xs text-slate-200">
                  {calculationInputJson}
                </pre>
              ) : null}
              {calculationOutputJson ? (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950/80 p-3 text-left text-xs text-slate-200">
                  {calculationOutputJson}
                </pre>
              ) : null}
            </details>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!canAddLine || isAddingLine} onClick={onAddLine} type="button">
              {isAddingLine ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              افزودن به صورت‌بها
            </Button>
            {addLineDisabledReason ? (
              <p className="text-xs leading-6 text-amber-100 light:text-amber-800">
                {addLineDisabledReason}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {lineSuccess ? (
        <p className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm leading-7 text-emerald-100 light:text-emerald-800">
          {lineSuccess}
        </p>
      ) : null}
      {lineError ? (
        <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
          {lineError}
        </p>
      ) : null}
    </section>
  );
}

function NotesSection({
  notes,
  title
}: {
  notes: PricebookItemDetail["requirements"];
  title: string;
}) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-base font-black text-white light:text-slate-950">{title}</h3>
      <div className="mt-3 space-y-2">
        {notes.map((note) => (
          <details
            className="group rounded-lg border border-white/10 bg-white/7 p-4 text-sm leading-7 text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
            key={note.id}
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-bold text-slate-100 light:text-slate-900">
              <span>
                {note.note_code ? `${note.note_code} - ` : ""}
                {note.title_fa}
                {note.affects_calculation ? (
                  <span className="mr-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-100 light:text-amber-800">
                    اثرگذار در محاسبه
                  </span>
                ) : null}
              </span>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3">{note.body_fa}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
      <p className="text-xs text-slate-400 light:text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-100 light:text-slate-900">{value}</p>
    </div>
  );
}

function ProjectCoefficientPanel({
  chapters,
  coefficientSets,
  isLoadingSets,
  onSelectedCoefficientSetIdChange,
  projectId,
  selectedChapterId,
  selectedCoefficientSetId,
  setsError
}: {
  chapters: PricebookChapter[];
  coefficientSets: ProjectCoefficientSet[];
  isLoadingSets: boolean;
  onSelectedCoefficientSetIdChange: (setId: number | null) => void;
  projectId: number;
  selectedChapterId: number | null;
  selectedCoefficientSetId: number | null;
  setsError: unknown;
}) {
  const selectedSet =
    coefficientSets.find((set) => set.id === selectedCoefficientSetId) ?? null;
  const [setName, setSetName] = useState("");
  const [setError, setSetError] = useState<string | null>(null);
  const [valueForm, setValueForm] = useState<CoefficientValueFormState>(
    initialCoefficientValueForm
  );
  const [valueError, setValueError] = useState<string | null>(null);
  const [createSet, createSetState] = useCreateProjectCoefficientSetMutation();
  const [createValue, createValueState] = useCreateCoefficientValueMutation();
  const [updateValue, updateValueState] = useUpdateCoefficientValueMutation();
  const [deleteValue, deleteValueState] = useDeleteCoefficientValueMutation();
  const {
    data: values = [],
    error: valuesError,
    isLoading: isLoadingValues
  } = useListCoefficientValuesQuery(selectedSet?.id ?? 0, { skip: !selectedSet });

  async function handleCreateSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetError(null);

    const name = setName.trim();
    if (!name) {
      setSetError("نام مجموعه ضرایب را وارد کنید.");
      return;
    }

    try {
      const createdSet = await createSet({
        projectId,
        body: {
          name,
          is_default: coefficientSets.length === 0
        }
      }).unwrap();
      setSetName("");
      onSelectedCoefficientSetIdChange(createdSet.id);
    } catch (error) {
      setSetError(getApiErrorMessage(error));
    }
  }

  function updateCoefficientKey(key: CoefficientKey) {
    setValueForm((current) => ({
      ...current,
      coefficient_key: key,
      label_fa: getCoefficientKeyLabel(key)
    }));
  }

  function updateCoefficientScope(scope: CoefficientScope) {
    setValueForm((current) => ({
      ...current,
      scope,
      chapter_id:
        scope === "chapter" ? current.chapter_id || String(selectedChapterId ?? "") : "",
      row_id: scope === "row" ? current.row_id : ""
    }));
  }

  async function handleCreateValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValueError(null);

    if (!selectedSet) {
      setValueError("ابتدا یک مجموعه ضرایب بسازید یا انتخاب کنید.");
      return;
    }

    const label = valueForm.label_fa.trim();
    if (!label) {
      setValueError("عنوان ضریب را وارد کنید.");
      return;
    }

    const multiplier = normalizeQuantityValue(valueForm.multiplier);
    if (!isPositiveDecimal(multiplier)) {
      setValueError("ضریب باید یک عدد مثبت باشد.");
      return;
    }

    const chapterId =
      valueForm.scope === "chapter" ? parsePositiveInteger(valueForm.chapter_id) : null;
    const rowId = valueForm.scope === "row" ? parsePositiveInteger(valueForm.row_id) : null;

    if (valueForm.scope === "chapter" && !chapterId) {
      setValueError("برای ضریب فصل، یک فصل را انتخاب کنید.");
      return;
    }

    if (valueForm.scope === "row" && !rowId) {
      setValueError("برای ضریب ردیف، شناسه ردیف معتبر لازم است.");
      return;
    }

    try {
      await createValue({
        setId: selectedSet.id,
        body: {
          coefficient_key: valueForm.coefficient_key,
          scope: valueForm.scope as ScopeEnum,
          chapter_id: chapterId,
          row_id: rowId,
          label_fa: label,
          multiplier,
          is_active: valueForm.is_active
        }
      }).unwrap();
      setValueForm({
        ...initialCoefficientValueForm,
        label_fa: getCoefficientKeyLabel(initialCoefficientValueForm.coefficient_key)
      });
    } catch (error) {
      setValueError(getApiErrorMessage(error));
    }
  }

  async function handleToggleValue(value: ProjectCoefficientValue) {
    if (!selectedSet) {
      return;
    }

    try {
      await updateValue({
        setId: selectedSet.id,
        valueId: value.id,
        body: { is_active: !value.is_active }
      }).unwrap();
    } catch (error) {
      setValueError(getApiErrorMessage(error));
    }
  }

  async function handleDeleteValue(value: ProjectCoefficientValue) {
    if (!selectedSet) {
      return;
    }

    try {
      await deleteValue({ setId: selectedSet.id, valueId: value.id }).unwrap();
    } catch (error) {
      setValueError(getApiErrorMessage(error));
    }
  }

  return (
    <GlassCard className="p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-lg font-black text-white light:text-slate-950">
              ضرایب پروژه
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
              ضریب فعال برای محاسبه آیتم‌ها اینجا انتخاب می‌شود؛ مدیریت کامل در همین بخش باز می‌شود.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={selectedSet ? "emerald" : "amber"}>
              {selectedSet ? `ضریب فعال: ${selectedSet.name}` : "بدون ضریب"}
            </StatusBadge>
            <span className={linkButtonClasses}>
              نمایش / ویرایش ضرایب
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div className="border-t border-white/10 p-5 light:border-slate-200">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-200 light:text-slate-700">
              مجموعه فعال برای محاسبه
            </span>
            <select
              className={inputClasses}
              disabled={isLoadingSets}
              onChange={(event) =>
                onSelectedCoefficientSetIdChange(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              value={selectedCoefficientSetId ?? ""}
            >
              <option value="">بدون ضریب</option>
              {coefficientSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                  {set.is_default ? " - پیش‌فرض" : ""}
                </option>
              ))}
            </select>
          </label>

          {isLoadingSets ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت مجموعه ضرایب
            </div>
          ) : null}

          {setsError ? (
            <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              {getApiErrorMessage(setsError)}
            </div>
          ) : null}

          {!isLoadingSets && !setsError && coefficientSets.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 text-sm leading-7 text-slate-300 light:border-slate-200 light:bg-white light:text-slate-600">
              هنوز مجموعه ضرایبی برای این پروژه ثبت نشده است.
            </div>
          ) : null}

          {selectedSet ? (
            <div className="rounded-lg border border-white/10 bg-white/7 p-3 light:border-slate-200 light:bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white light:text-slate-950">
                  مقادیر {selectedSet.name}
                </p>
                {isLoadingValues ? <Loader2 className="h-4 w-4 animate-spin text-emerald-200" /> : null}
              </div>

              {valuesError ? (
                <div className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                  {getApiErrorMessage(valuesError)}
                </div>
              ) : null}

              {!isLoadingValues && !valuesError && values.length === 0 ? (
                <p className="mt-3 text-sm leading-7 text-slate-400 light:text-slate-500">
                  هنوز مقدار ضریبی ثبت نشده است.
                </p>
              ) : null}

              <div className="mt-3 space-y-2">
                {values.map((value) => (
                  <div
                    className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white"
                    key={value.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white light:text-slate-950">
                          {value.label_fa || getCoefficientKeyLabel(value.coefficient_key)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                          {getCoefficientKeyLabel(value.coefficient_key)} |{" "}
                          {getCoefficientScopeLabel(value.scope)} | ضریب {value.multiplier ?? "1"}
                        </p>
                      </div>
                      <StatusBadge tone={value.is_active === false ? "amber" : "emerald"}>
                        {value.is_active === false ? "غیرفعال" : "فعال"}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className={linkButtonClasses}
                        disabled={updateValueState.isLoading}
                        onClick={() => void handleToggleValue(value)}
                        type="button"
                      >
                        {value.is_active === false ? "فعال‌کردن" : "غیرفعال‌کردن"}
                      </button>
                      <button
                        className={linkButtonClasses}
                        disabled={deleteValueState.isLoading}
                        onClick={() => void handleDeleteValue(value)}
                        type="button"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <form className="space-y-3" onSubmit={handleCreateSet}>
            <Field label="ساخت مجموعه ضرایب">
              <input
                className={inputClasses}
                onChange={(event) => setSetName(event.target.value)}
                placeholder="مثلا ضرایب قرارداد اصلی"
                value={setName}
              />
            </Field>
            <Button disabled={createSetState.isLoading} type="submit">
              {createSetState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              ساخت مجموعه
            </Button>
            {setError ? (
              <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                {setError}
              </p>
            ) : null}
          </form>

          <form className="space-y-3 rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50" onSubmit={handleCreateValue}>
            <p className="text-sm font-black text-white light:text-slate-950">
              افزودن مقدار ضریب
            </p>
            <Field label="نوع ضریب">
              <select
                className={inputClasses}
                onChange={(event) => updateCoefficientKey(event.target.value as CoefficientKey)}
                value={valueForm.coefficient_key}
              >
                {coefficientKeyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="عنوان نمایشی">
              <input
                className={inputClasses}
                onChange={(event) =>
                  setValueForm((current) => ({ ...current, label_fa: event.target.value }))
                }
                value={valueForm.label_fa}
              />
            </Field>
            <Field label="ضریب">
              <input
                className={classNames(inputClasses, "text-left")}
                dir="ltr"
                inputMode="decimal"
                onChange={(event) =>
                  setValueForm((current) => ({ ...current, multiplier: event.target.value }))
                }
                placeholder="1.1"
                value={valueForm.multiplier}
              />
            </Field>
            <Field label="محدوده اثر">
              <select
                className={inputClasses}
                onChange={(event) => updateCoefficientScope(event.target.value as CoefficientScope)}
                value={valueForm.scope}
              >
                {coefficientScopeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            {valueForm.scope === "chapter" ? (
              <Field label="فصل">
                <select
                  className={inputClasses}
                  onChange={(event) =>
                    setValueForm((current) => ({ ...current, chapter_id: event.target.value }))
                  }
                  value={valueForm.chapter_id}
                >
                  <option value="">انتخاب فصل</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.chapter_code} - {chapter.title_fa}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {valueForm.scope === "row" ? (
              <Field label="شناسه ردیف">
                <input
                  className={classNames(inputClasses, "text-left")}
                  dir="ltr"
                  inputMode="numeric"
                  onChange={(event) =>
                    setValueForm((current) => ({ ...current, row_id: event.target.value }))
                  }
                  placeholder="شناسه ردیف از جزئیات آیتم"
                  value={valueForm.row_id}
                />
              </Field>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-bold text-slate-200 light:text-slate-700">
              <input
                checked={valueForm.is_active}
                onChange={(event) =>
                  setValueForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                type="checkbox"
              />
              فعال باشد
            </label>
            <Button disabled={!selectedSet || createValueState.isLoading} type="submit">
              {createValueState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              افزودن ضریب
            </Button>
            {valueError ? (
              <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                {valueError}
              </p>
            ) : null}
          </form>
        </div>
      </div>
        </div>
      </details>
    </GlassCard>
  );
}

function CurrentDocumentPanel({
  document,
  onDocumentUpdated,
  selectedCoefficientSetName,
  selectedEditionYear,
  setupNotice
}: {
  document: FinancialDocument | null;
  onDocumentUpdated: (document: FinancialDocument) => void;
  selectedCoefficientSetName: string | null;
  selectedEditionYear: number | undefined;
  setupNotice: string | null;
}) {
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [latestExport, setLatestExport] = useState<FinancialDocumentExport | null>(null);
  const [recalculateDocument, recalculateState] = useRecalculateFinancialDocumentMutation();
  const [lockDocument, lockState] = useLockFinancialDocumentMutation();
  const [updateLine, updateLineState] = useUpdateFinancialDocumentLineMutation();
  const [deleteLine, deleteLineState] = useDeleteFinancialDocumentLineMutation();
  const [retrievePreview, previewState] = useLazyRetrieveFinancialDocumentPreviewQuery();
  const [createExport, createExportState] = useCreateFinancialDocumentExportMutation();
  const [downloadExport, downloadExportState] = useDownloadFinancialDocumentExportMutation();
  const lines = document?.lines ?? [];
  const totals = getDocumentTotals(document);
  const isLocked = isFinancialDocumentLocked(document);
  const isActionBusy =
    recalculateState.isLoading ||
    lockState.isLoading ||
    updateLineState.isLoading ||
    deleteLineState.isLoading ||
    previewState.isFetching ||
    createExportState.isLoading ||
    downloadExportState.isLoading;

  function startEditingLine(line: FinancialDocumentLine) {
    setActionError(null);
    setActionSuccess(null);
    setEditingLineId(line.id);
    setEditingQuantity(line.quantity);
  }

  async function handleRecalculate() {
    if (!document) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setActionSuccess("صورت‌بها دوباره محاسبه شد.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleLockDocument() {
    if (!document || isLocked) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedDocument = await lockDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setActionSuccess("صورت‌بها قفل شد و دیگر قابل ویرایش نیست.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleSaveLine(line: FinancialDocumentLine) {
    if (!document || isLocked) {
      setActionError("این صورت‌بها قفل شده و قابل ویرایش نیست.");
      return;
    }

    const normalizedQuantity = normalizeQuantityValue(editingQuantity);
    if (!isPositiveDecimal(normalizedQuantity)) {
      setActionError("مقدار خط باید یک عدد مثبت باشد.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await updateLine({
        documentId: document.id,
        lineId: line.id,
        body: { quantity: normalizedQuantity }
      }).unwrap();
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setEditingLineId(null);
      setEditingQuantity("");
      setActionSuccess("مقدار خط به‌روزرسانی شد.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleDeleteLine(line: FinancialDocumentLine) {
    if (!document || isLocked) {
      setActionError("این صورت‌بها قفل شده و قابل ویرایش نیست.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteLine({ documentId: document.id, lineId: line.id }).unwrap();
      const updatedDocument = await recalculateDocument(document.id).unwrap();
      onDocumentUpdated(updatedDocument);
      setActionSuccess("خط از صورت‌بها حذف شد.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handlePreviewDocument() {
    if (!document) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const html = await retrievePreview(document.id).unwrap();
      setPreviewHtml(html);
      setActionSuccess("پیش‌نمایش HTML صورت‌بها آماده است.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleCreateExport() {
    if (!document) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const exportRecord = await createExport(document.id).unwrap();
      setLatestExport(exportRecord);
      if (exportRecord.status === "ready" && exportRecord.file_id) {
        setActionSuccess("خروجی ثبت شد و فایل آماده دانلود است.");
      } else {
        setActionSuccess(
          "خروجی PDF هنوز در نسخه آزمایشی فعال نیست. پیش‌نمایش HTML قابل مشاهده است."
        );
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleDownloadExport() {
    if (!latestExport) {
      setActionError("ابتدا خروجی را ایجاد کنید.");
      return;
    }

    if (latestExport.status !== "ready" || !latestExport.file_id) {
      setActionError(
        "خروجی PDF هنوز در نسخه آزمایشی فعال نیست. پیش‌نمایش HTML قابل مشاهده است."
      );
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const pdfBlob = await downloadExport(latestExport.id).unwrap();
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = `${document?.document_number ?? "ratab-cost-report"}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setActionSuccess("دانلود فایل خروجی شروع شد.");
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? String(error.status) : "";
      if (status === "409") {
        setActionError(
          "خروجی PDF هنوز در نسخه آزمایشی فعال نیست. پیش‌نمایش HTML قابل مشاهده است."
        );
        return;
      }
      setActionError(getApiErrorMessage(error));
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">صورت‌بهای جاری</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            خطوطی که از محاسبه آیتم‌ها به سند اضافه می‌شوند، اینجا نمایش داده می‌شوند.
          </p>
        </div>
        <StatusBadge tone={document ? getDocumentStatusTone(document.status) : "amber"}>
          {document ? `${getDocumentStatusLabel(document.status)} - ${totals.lineCount} خط` : "سند ساخته نشده"}
        </StatusBadge>
      </div>

      {!document ? (
        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
          {setupNotice ??
            "مرور فهرست‌بها فعال است، اما سند قابل ثبت خط هنوز در این محیط آزمایشی آماده نیست."}
        </div>
      ) : null}

      {document ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoBox label="عنوان سند" value={document.title} />
            <InfoBox label="شماره سند" value={document.document_number ?? "—"} />
            <InfoBox
              label="سال فهرست‌بها"
              value={selectedEditionYear ? String(selectedEditionYear) : "—"}
            />
            <InfoBox label="ضریب فعال" value={selectedCoefficientSetName ?? "بدون ضریب"} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <InfoBox label="جمع فهرست‌بها" value={formatMoneyAmount(totals.pricebookAmount)} />
            <InfoBox label="جمع ضرایب" value={formatMoneyAmount(totals.coefficientAmount)} />
            <InfoBox label="جمع کل" value={formatMoneyAmount(totals.totalAmount)} />
            <InfoBox
              label="آخرین محاسبه"
              value={document.calculated_at ? "ثبت شده" : "در انتظار محاسبه"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={isActionBusy || isLocked}
              onClick={() => void handleRecalculate()}
              type="button"
              variant="secondary"
            >
              {recalculateState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              محاسبه مجدد
            </Button>
            <Button
              disabled={isActionBusy || isLocked}
              onClick={() => void handleLockDocument()}
              type="button"
              variant="secondary"
            >
              {lockState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              قفل کردن صورت‌بها
            </Button>
            <Button
              disabled={isActionBusy}
              onClick={() => void handlePreviewDocument()}
              type="button"
              variant="secondary"
            >
              {previewState.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              پیش‌نمایش صورت‌بها
            </Button>
            <Button
              disabled={isActionBusy}
              onClick={() => void handleCreateExport()}
              type="button"
              variant="secondary"
            >
              {createExportState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              خروجی گرفتن
            </Button>
            <Button
              disabled={isActionBusy || !latestExport}
              onClick={() => void handleDownloadExport()}
              type="button"
              variant="ghost"
            >
              {downloadExportState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              دانلود PDF
            </Button>
            {isLocked ? (
              <p className="text-xs leading-6 text-violet-100 light:text-violet-800">
                سند قفل شده است؛ ویرایش، حذف و افزودن خط غیرفعال شده‌اند.
              </p>
            ) : null}
          </div>

          {actionSuccess ? (
            <p className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 p-3 text-sm leading-7 text-emerald-100 light:text-emerald-800">
              {actionSuccess}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              {actionError}
            </p>
          ) : null}

          {latestExport ? (
            <div className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-3 text-sm leading-7 text-violet-100 light:text-violet-800">
              <p className="font-black">
                وضعیت خروجی: {latestExport.status === "ready" ? "آماده" : latestExport.status === "failed" ? "ناموفق" : "در حال پردازش"}
              </p>
              {latestExport.error_message ? <p className="mt-1">{latestExport.error_message}</p> : null}
              {latestExport.status !== "ready" || !latestExport.file_id ? (
                <p className="mt-1">
                  خروجی PDF هنوز در نسخه آزمایشی فعال نیست. پیش‌نمایش HTML قابل مشاهده است.
                </p>
              ) : null}
            </div>
          ) : null}

          {previewHtml ? (
            <section className="overflow-hidden rounded-lg border border-emerald-300/20 bg-emerald-400/10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-300/15 px-4 py-3">
                <div>
                  <h3 className="font-black text-white light:text-slate-950">پیش‌نمایش HTML صورت‌بها</h3>
                  <p className="mt-1 text-xs leading-6 text-emerald-100 light:text-emerald-800">
                    پیش‌نمایش در iframe sandbox شده نمایش داده می‌شود.
                  </p>
                </div>
                <StatusBadge tone="emerald">آماده مشاهده</StatusBadge>
              </div>
              <iframe
                className="h-[70vh] w-full bg-white"
                sandbox=""
                srcDoc={previewHtml}
                title="پیش‌نمایش HTML صورت‌بها"
              />
            </section>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-white/10 light:border-slate-200">
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                <div className="grid grid-cols-[70px_110px_1fr_130px_90px_130px_130px_130px_130px] gap-3 bg-white/7 px-4 py-3 text-xs font-bold text-slate-300 light:bg-slate-50 light:text-slate-600">
                  <span>ردیف</span>
                  <span>کد</span>
                  <span>شرح</span>
                  <span>مقدار</span>
                  <span>واحد</span>
                  <span>بهای واحد</span>
                  <span>مبلغ پایه</span>
                  <span>مبلغ ضرایب</span>
                  <span>مبلغ کل</span>
                </div>
          {lines.length === 0 ? (
            <div className="px-4 py-5 text-center text-sm text-slate-400 light:text-slate-500">
              هنوز خطی به صورت‌بها اضافه نشده است.
            </div>
          ) : null}
                <div className="max-h-[36vh] overflow-y-auto [scrollbar-color:rgba(16,185,129,0.55)_rgba(15,23,42,0.25)] [scrollbar-width:thin]">
                  {lines.map((line: FinancialDocumentLine) => (
                    <div
                      className="grid grid-cols-[70px_110px_1fr_130px_90px_130px_130px_130px_130px] gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-200 light:border-slate-200 light:text-slate-700"
                      key={line.id}
                    >
                      <span>{line.line_no}</span>
                      <span className="font-mono text-emerald-200 light:text-emerald-700">
                        {line.row_code_snapshot}
                      </span>
                      <span>{line.description_snapshot}</span>
                      <span>
                        {editingLineId === line.id ? (
                          <input
                            className={classNames(inputClasses, "h-9 text-left")}
                            dir="ltr"
                            inputMode="decimal"
                            onChange={(event) => setEditingQuantity(event.target.value)}
                            value={editingQuantity}
                          />
                        ) : (
                          line.quantity
                        )}
                      </span>
                      <span>{line.unit_snapshot}</span>
                      <span>{formatMoneyAmount(line.unit_price_snapshot)}</span>
                      <span>{formatMoneyAmount(line.base_amount_snapshot)}</span>
                      <span>{formatMoneyAmount(line.coefficient_amount_snapshot)}</span>
                      <span className="font-bold text-slate-100 light:text-slate-900">
                        {formatMoneyAmount(line.total_amount_snapshot)}
                      </span>
                      <div className="col-span-9 flex flex-wrap gap-2">
                        {editingLineId === line.id ? (
                          <>
                            <button
                              className={linkButtonClasses}
                              disabled={isActionBusy || isLocked}
                              onClick={() => void handleSaveLine(line)}
                              type="button"
                            >
                              <Save className="h-4 w-4" />
                              ذخیره مقدار
                            </button>
                            <button
                              className={linkButtonClasses}
                              disabled={isActionBusy}
                              onClick={() => {
                                setEditingLineId(null);
                                setEditingQuantity("");
                              }}
                              type="button"
                            >
                              انصراف
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={linkButtonClasses}
                              disabled={isActionBusy || isLocked}
                              onClick={() => startEditingLine(line)}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                              ویرایش مقدار
                            </button>
                            <button
                              className={linkButtonClasses}
                              disabled={isActionBusy || isLocked}
                              onClick={() => void handleDeleteLine(line)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف خط
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {document.chapter_totals.length > 0 ? (
            <details className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
              <summary className="cursor-pointer text-sm font-black text-white light:text-slate-950">
                جمع فصل‌ها
              </summary>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {document.chapter_totals.map((chapterTotal) => (
                  <div
                    className="rounded-lg border border-white/10 bg-slate-950/35 p-3 text-sm light:border-slate-200 light:bg-white"
                    key={chapterTotal.id}
                  >
                    <p className="font-bold text-slate-100 light:text-slate-900">
                      {chapterTotal.chapter_code_snapshot} - {chapterTotal.chapter_title_snapshot}
                    </p>
                    <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
                      جمع نهایی: {formatMoneyAmount(chapterTotal.final_total_amount)}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <div className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-3 text-sm leading-7 text-violet-100 light:text-violet-800">
            پیش‌نمایش HTML از backend دریافت می‌شود. خروجی PDF در v0.0 ممکن است به‌صورت metadata ناموفق ثبت شود و تا تایید موتور رندر، دانلود فایل واقعی فعال نیست.
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}

export function CostReportWizardPage() {
  const { companyId } = useParams();
  const parsedCompanyId = Number(companyId);
  const hasValidCompanyId = Number.isInteger(parsedCompanyId) && parsedCompanyId > 0;

  const [step, setStep] = useState<WizardStep>("setup");
  const [form, setForm] = useState<WizardFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [createdDocument, setCreatedDocument] = useState<FinancialDocument | null>(null);
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
  } = useListPricebookEditionsQuery(selectedPricebook?.id ?? 0, { skip: !selectedPricebook });
  const editions = getListResults<PricebookEdition>(editionsData);
  const selectedEdition =
    editions.find((edition) => edition.id === selectedEditionId) ?? getDefaultEdition(editions);
  const selectedActivePriceSet = selectedEdition?.active_price_set ?? null;

  const {
    data: chaptersData,
    error: chaptersError,
    isLoading: isLoadingChapters
  } = useListPricebookChaptersQuery(selectedEdition?.id ?? 0, { skip: !selectedEdition });
  const chapters = useMemo(() => getListResults<PricebookChapter>(chaptersData), [chaptersData]);
  const filteredChapters = useMemo(
    () => chapters.filter((chapter) => matchesChapterFilter(chapter, activeChapterFilter)),
    [activeChapterFilter, chapters]
  );
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups
  } = useListPricebookGroupsQuery(
    selectedChapterId ?? 0,
    { skip: !selectedChapterId }
  );
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
  } = useListProjectCoefficientSetsQuery(createdProject?.id ?? 0, { skip: !createdProject });

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

  const [createProject, createProjectState] = useCreateCompanyProjectMutation();
  const [createDocument, createDocumentState] = useCreateProjectFinancialDocumentMutation();
  const isSubmitting = createProjectState.isLoading || createDocumentState.isLoading;
  const deprecatedConfiguredPriceSetId = getDeprecatedConfiguredPriceSetId();

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

  function updateField(field: keyof WizardFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setFormError("برای استفاده از تنظیمات پیشرفته توسعه، تایید استفاده از شناسه فنی لازم است.");
      return;
    }

    if (!selectedActivePriceSet && isDevPriceSetConfirmed && !manualPriceSetId && !deprecatedConfiguredPriceSetId) {
      setFormError("تنظیم آزمایشی معتبر وارد یا پیکربندی نشده است.");
      return;
    }

    const fallbackPriceSetId = isDevPriceSetConfirmed
      ? manualPriceSetId ?? deprecatedConfiguredPriceSetId
      : null;
    const priceSetId = selectedActivePriceSet?.id ?? fallbackPriceSetId;
    const baseYear = parsePositiveInteger(form.base_year) ?? 1404;

    if (!priceSetId) {
      setFormError("برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.");
      return;
    }

    try {
      const project = await createProject({
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
      }).unwrap();

      const document = await createDocument({
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
      }).unwrap();

      setCreatedProject(project);
      setCreatedDocument(document);
      setDocumentSetupNotice(null);
      setStep("browser");
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <StatusBadge tone="emerald">
              <FileText className="h-3.5 w-3.5" />
              جادوگر صورت‌بها
            </StatusBadge>
            <div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                افزودن صورت‌بها
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 light:text-slate-600">
                {company?.name ? `${company.name} - ` : ""}
                از این مسیر، صورت‌بها مثل یک پیوست کاری از گفتگوی شرکت شروع می‌شود. ابتدا اطلاعات
                اصلی را وارد کنید، سپس فصل‌ها، گروه‌ها و آیتم‌های فهرست‌بها را مرور کنید.
              </p>
            </div>
          </div>
          <Link className={linkButtonClasses} to={`/companies/${parsedCompanyId}`}>
            بازگشت به داشبورد شرکت
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className={classNames("p-4", step === "setup" && "border-emerald-300/35")}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200">
              ۱
            </span>
            <div>
              <h2 className="font-black text-white light:text-slate-950">پروژه و صورت‌بها</h2>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                ثبت اطلاعات اولیه و ورود به مرور فهرست‌بها
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className={classNames("p-4", step === "browser" && "border-emerald-300/35")}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200">
              ۲
            </span>
            <div>
              <h2 className="font-black text-white light:text-slate-950">مرور فهرست‌بها</h2>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
                فصل‌ها، گروه‌ها و آیتم‌ها
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {step === "setup" ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <FolderKanban className="mt-1 h-5 w-5 text-emerald-200" />
              <div>
                <h2 className="text-xl font-black text-white light:text-slate-950">اطلاعات پروژه</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                  سال پایه به صورت پیش‌فرض ۱۴۰۴ است و برای این صورت‌بها استفاده می‌شود.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="نام پروژه" required>
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("project_name", event.target.value)}
                  placeholder="مثلاً پروژه نمونه رتب"
                  required
                  value={form.project_name}
                />
              </Field>
              <Field label="کد پروژه">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("project_code", event.target.value)}
                  placeholder="اختیاری"
                  value={form.project_code}
                />
              </Field>
              <Field label="شماره قرارداد">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("contract_number", event.target.value)}
                  placeholder="اختیاری"
                  value={form.contract_number}
                />
              </Field>
              <Field label="سال پایه">
                <input
                  className={inputClasses}
                  inputMode="numeric"
                  onChange={(event) => updateField("base_year", event.target.value)}
                  value={form.base_year}
                />
              </Field>
              <Field label="کارفرما">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("employer_name", event.target.value)}
                  placeholder="اختیاری"
                  value={form.employer_name}
                />
              </Field>
              <Field label="مشاور">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("consultant_name", event.target.value)}
                  placeholder="اختیاری"
                  value={form.consultant_name}
                />
              </Field>
              <Field label="پیمانکار">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("contractor_name", event.target.value)}
                  placeholder="اختیاری"
                  value={form.contractor_name}
                />
              </Field>
              <Field label="دستگاه اجرایی">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("executive_agency_name", event.target.value)}
                  placeholder="اختیاری"
                  value={form.executive_agency_name}
                />
              </Field>
              <Field label="تاریخ شروع">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("starts_on", event.target.value)}
                  type="date"
                  value={form.starts_on}
                />
              </Field>
              <Field label="تاریخ پایان">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("ends_on", event.target.value)}
                  type="date"
                  value={form.ends_on}
                />
              </Field>
              <Field className="md:col-span-2" label="توضیحات پروژه">
                <textarea
                  className={textareaClasses}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="اختیاری"
                  value={form.description}
                />
              </Field>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-violet-200" />
              <div>
                <h2 className="text-xl font-black text-white light:text-slate-950">اطلاعات صورت‌بها</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                  اطلاعات گزارش را وارد کنید. این نسخه آزمایشی مرور فهرست‌بهای فعال ۱۴۰۴ را بدون
                  نمایش شناسه‌های فنی شروع می‌کند.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="عنوان صورت‌بها" required>
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("document_title", event.target.value)}
                  placeholder="مثلاً صورت‌بهای ماه اول"
                  required
                  value={form.document_title}
                />
              </Field>
              <Field label="عنوان گزارش">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("report_title", event.target.value)}
                  placeholder="اختیاری"
                  value={form.report_title}
                />
              </Field>
              <Field label="شماره سند">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("document_number", event.target.value)}
                  placeholder="اختیاری"
                  value={form.document_number}
                />
              </Field>
              <Field label="تاریخ سند">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("document_date", event.target.value)}
                  type="date"
                  value={form.document_date}
                />
              </Field>
              <Field label="شروع دوره">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("period_start_on", event.target.value)}
                  type="date"
                  value={form.period_start_on}
                />
              </Field>
              <Field label="پایان دوره">
                <input
                  className={inputClasses}
                  onChange={(event) => updateField("period_end_on", event.target.value)}
                  type="date"
                  value={form.period_end_on}
                />
              </Field>
              <Field label="فهرست‌بها و سال">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className={inputClasses}
                    disabled={isLoadingPricebooks || pricebooks.length === 0}
                    onChange={(event) => handlePricebookChange(event.target.value)}
                    value={selectedPricebook?.id ?? ""}
                  >
                    {pricebooks.map((pricebook) => (
                      <option key={pricebook.id} value={pricebook.id}>
                        {pricebook.code} - {pricebook.title_fa}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClasses}
                    disabled={isLoadingEditions || editions.length === 0}
                    onChange={(event) => handleEditionChange(event.target.value)}
                    value={selectedEdition?.id ?? ""}
                  >
                    {editions.map((edition) => (
                      <option key={edition.id} value={edition.id}>
                        {edition.year} - {edition.title_fa}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            {pricebooksError || editionsError ? (
              <div className="mt-4 rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100 light:text-rose-700">
                دریافت فهرست‌بهای فعال با خطا روبه‌رو شد. لطفاً اتصال به سرویس را بررسی کنید و دوباره تلاش کنید.
              </div>
            ) : null}

            {!isLoadingPricebooks && !pricebooksError && pricebooks.length === 0 ? (
              <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
                هنوز فهرست‌بهایی برای مرور در دسترس نیست.
              </div>
            ) : null}

            {selectedEdition && !selectedActivePriceSet ? (
              <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800">
                برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100 light:text-emerald-800">
              این نسخه آزمایشی از فهرست‌بهای فعال ۱۴۰۴ استفاده می‌کند. اگر سال انتخابی قیمت فعال داشته باشد،
              سند صورت‌بها هم‌زمان ساخته می‌شود و بعد از محاسبه می‌توانید آیتم‌ها را به آن اضافه کنید.
            </div>

            <details
              className="mt-4 rounded-lg border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-800"
              onToggle={(event) => {
                setIsAdvancedDevOpen(event.currentTarget.open);
                if (!event.currentTarget.open) {
                  setIsDevPriceSetConfirmed(false);
                }
              }}
            >
              <summary className="cursor-pointer font-black">تنظیمات پیشرفته توسعه</summary>
              <p className="mt-3">
                این بخش فقط برای تست داخلی است. مسیر عادی از قیمت فعال سال انتخاب‌شده استفاده می‌کند؛
                این مقدار فقط وقتی لازم است که همان پاسخ هنوز قیمت فعال نداشته باشد.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="space-y-2">
                  <span className="text-xs font-bold">شناسه فنی مجموعه قیمت</span>
                  <input
                    className={classNames(inputClasses, "text-left")}
                    dir="ltr"
                    inputMode="numeric"
                    onChange={(event) => updateField("price_set_id", event.target.value)}
                    placeholder="فقط برای تست توسعه"
                    value={form.price_set_id}
                  />
                </label>
                <label className="flex items-center gap-2 self-end rounded-lg border border-amber-300/20 px-3 py-3 text-xs font-bold">
                  <input
                    checked={isDevPriceSetConfirmed}
                    disabled={!isAdvancedDevOpen}
                    onChange={(event) => setIsDevPriceSetConfirmed(event.target.checked)}
                    type="checkbox"
                  />
                  تایید استفاده آزمایشی
                </label>
              </div>
            </details>
          </GlassCard>

          {formError ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
              <XCircle className="mt-1 h-4 w-4 shrink-0" />
              {formError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              ادامه به مرور فهرست‌بها
            </Button>
            <p className="text-xs leading-6 text-slate-400 light:text-slate-500">
              بعد از موفقیت، فصل‌های فهرست‌بها از API خوانده می‌شوند.
            </p>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <GlassCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white light:text-slate-950">مرور فهرست‌بها آماده است</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                  پروژه: {createdProject?.name} | صورت‌بها: {createdDocument?.title ?? form.document_title}
                </p>
              </div>
              <StatusBadge tone="emerald">سال {selectedEdition?.year ?? "۱۴۰۴"}</StatusBadge>
            </div>
          </GlassCard>

          <CurrentDocumentPanel
            document={createdDocument}
            onDocumentUpdated={setCreatedDocument}
            selectedCoefficientSetName={selectedCoefficientSet?.name ?? null}
            selectedEditionYear={selectedEdition?.year}
            setupNotice={documentSetupNotice}
          />

          {createdProject ? (
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

          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-200" />
                <h2 className="text-lg font-black text-white light:text-slate-950">فصل‌ها</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {chapterFilters.map((filter) => (
                  <button
                    className={classNames(
                      "rounded-full border px-3 py-2 text-xs font-bold transition",
                      activeChapterFilter === filter.id
                        ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                        : "border-white/10 bg-white/7 text-slate-300 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-600"
                    )}
                    key={filter.id}
                    onClick={() => {
                      setActiveChapterFilter(filter.id);
                      setSelectedChapterId(null);
                      setSelectedGroupId(null);
                    }}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {isLoadingChapters ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    دریافت فصل‌ها
                  </div>
                ) : null}
                {chaptersError ? (
                  <div className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100 light:text-rose-700">
                    دریافت فصل‌ها ناموفق بود.
                  </div>
                ) : null}
                {!isLoadingChapters && !chaptersError && filteredChapters.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-white/7 p-3 text-sm leading-7 text-slate-400 light:border-slate-200 light:bg-white light:text-slate-500">
                    فصلی برای این انتخاب پیدا نشد.
                  </div>
                ) : null}
                {filteredChapters.map((chapter) => (
                  <button
                    className={classNames(
                      "w-full rounded-lg border p-3 text-right transition",
                      selectedChapterId === chapter.id
                        ? "border-emerald-300/35 bg-emerald-400/15"
                        : "border-white/10 bg-white/7 hover:border-white/20 light:border-slate-200 light:bg-white"
                    )}
                    key={chapter.id}
                    onClick={() => handleChapterSelect(chapter)}
                    type="button"
                  >
                    <p className="font-mono text-xs text-emerald-200 light:text-emerald-700">
                      {chapter.chapter_code}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-100 light:text-slate-900">
                      {chapter.title_fa}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <div className="space-y-5">
              <GlassCard className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white light:text-slate-950">
                      {selectedChapter ? selectedChapter.title_fa : "یک فصل را انتخاب کنید"}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                      گروه‌ها بالای فهرست آیتم‌ها قرار می‌گیرند. کدهای ردیف به صورت رشته حفظ می‌شوند.
                    </p>
                  </div>
                  {selectedChapter ? (
                    <StatusBadge tone="violet">فصل {selectedChapter.chapter_code}</StatusBadge>
                  ) : null}
                </div>

                {selectedChapter ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        className={classNames(
                          "rounded-full border px-3 py-2 text-xs font-bold transition",
                          selectedGroupId === null
                            ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                            : "border-white/10 bg-white/7 text-slate-300 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-600"
                        )}
                        onClick={() => setSelectedGroupId(null)}
                        type="button"
                      >
                        همه گروه‌ها
                      </button>
                      {isLoadingGroups ? (
                        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          دریافت گروه‌ها
                        </span>
                      ) : null}
                      {groupsError ? (
                        <span className="text-xs font-bold text-rose-200 light:text-rose-700">
                          دریافت گروه‌ها ناموفق بود.
                        </span>
                      ) : null}
                      {groups.map((group: PricebookGroup) => (
                        <button
                          className={classNames(
                            "rounded-full border px-3 py-2 text-xs font-bold transition",
                            selectedGroupId === group.id
                              ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 light:text-emerald-800"
                              : "border-white/10 bg-white/7 text-slate-300 hover:border-white/20 light:border-slate-200 light:bg-white light:text-slate-600"
                          )}
                          key={group.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          type="button"
                        >
                          {group.group_code} - {group.title_fa}
                        </button>
                      ))}
                    </div>

                    <label className="mt-5 flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-slate-950/45 px-4 text-slate-400 light:border-slate-200 light:bg-white">
                      <Search className="h-4 w-4" />
                      <input
                        className="h-full flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 light:text-slate-950"
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="جستجو در آیتم‌ها یا کد ردیف"
                        value={searchTerm}
                      />
                    </label>
                  </>
                ) : null}
              </GlassCard>

              {selectedChapter ? (
                <GlassCard className="p-0">
                  <div className="border-b border-white/10 px-5 py-4 light:border-slate-200">
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-5 w-5 text-emerald-200" />
                      <h3 className="font-black text-white light:text-slate-950">آیتم‌ها</h3>
                      {isFetchingItems ? <Loader2 className="h-4 w-4 animate-spin text-emerald-200" /> : null}
                    </div>
                  </div>
                  <div className="max-h-[50vh] divide-y divide-white/10 overflow-y-auto [scrollbar-color:rgba(16,185,129,0.55)_rgba(15,23,42,0.25)] [scrollbar-width:thin] md:max-h-[62vh] light:divide-slate-200">
                    {itemsError ? (
                      <div className="p-6 text-center text-sm leading-7 text-rose-100 light:text-rose-700">
                        دریافت آیتم‌ها ناموفق بود.
                      </div>
                    ) : null}
                    {items.length === 0 && !isFetchingItems && !itemsError ? (
                      <div className="p-6 text-center text-sm text-slate-400 light:text-slate-500">
                        آیتمی برای این انتخاب پیدا نشد.
                      </div>
                    ) : null}
                    {items.map((item: PricebookItemList) => (
                      <button
                        className="grid w-full gap-3 p-4 text-right transition hover:bg-white/7 light:hover:bg-slate-50 md:grid-cols-[130px_1fr_120px_150px]"
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        type="button"
                      >
                        <span className="font-mono text-sm text-emerald-200 light:text-emerald-700">
                          {item.item_key}
                        </span>
                        <span className="text-sm font-bold text-slate-100 light:text-slate-900">
                          {item.short_name_fa}
                        </span>
                        <span className="text-sm text-slate-300 light:text-slate-600">{item.unit}</span>
                        <span className="text-sm text-slate-300 light:text-slate-600">
                          {formatMoneyAmount(item.unit_price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </GlassCard>
              ) : (
                <EmptyState
                  description="ابتدا از ستون سمت راست یک فصل فهرست‌بها را انتخاب کنید."
                  icon={<BookOpen className="h-7 w-7" />}
                  title="مرور آیتم‌ها آماده است"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {selectedItemId ? (
        <ItemDetailModal
          coefficientSets={coefficientSets}
          document={createdDocument}
          itemId={selectedItemId}
          onSelectedCoefficientSetIdChange={setSelectedCoefficientSetId}
          onClose={() => setSelectedItemId(null)}
          onDocumentUpdated={setCreatedDocument}
          selectedCoefficientSetId={selectedCoefficientSetId}
        />
      ) : null}
    </div>
  );
}

function Field({
  children,
  className,
  label,
  required = false
}: {
  children: ReactNode;
  className?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className={classNames("space-y-2", className)}>
      <span className="text-sm font-bold text-slate-200 light:text-slate-700">
        {label}
        {required ? <span className="text-emerald-300"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
