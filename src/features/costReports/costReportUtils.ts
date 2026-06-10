import type { FinancialDocument } from "../financialDocuments/financialDocumentApi";
import type { PricebookChapter, PricebookEdition, PricebookItemDetail } from "../pricebooks/pricebookApi";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { normalizeNumberInput, normalizeRowCode } from "../../shared/utils/numberText";

import {
  chapterFilters,
  coefficientKeyOptions,
  coefficientScopeOptions,
  initialForm
} from "./constants";
import type { CostReportBuilderState, DocumentTotals, WizardFormState } from "./types";

export function getInitialWizardForm(
  builderState: CostReportBuilderState | null
): WizardFormState {
  return {
    ...initialForm,
    project_code: builderState?.existingProject?.project_code ?? "",
    project_name: builderState?.existingProject?.name ?? "",
    contract_number: builderState?.existingProject?.contract_number ?? "",
    employer_name: builderState?.existingProject?.employer_name ?? "",
    consultant_name: builderState?.existingProject?.consultant_name ?? "",
    contractor_name: builderState?.existingProject?.contractor_name ?? "",
    executive_agency_name: builderState?.existingProject?.executive_agency_name ?? "",
    base_year: String(builderState?.existingProject?.base_year ?? initialForm.base_year),
    starts_on: builderState?.existingProject?.starts_on ?? "",
    ends_on: builderState?.existingProject?.ends_on ?? "",
    description: builderState?.existingProject?.description ?? "",
    document_number: builderState?.existingDocument?.document_number ?? "",
    document_title: builderState?.existingDocument?.title ?? "",
    report_title: builderState?.existingDocument?.report_title ?? "",
    document_date: builderState?.existingDocument?.document_date ?? "",
    period_start_on: builderState?.existingDocument?.period_start_on ?? "",
    period_end_on: builderState?.existingDocument?.period_end_on ?? ""
  };
}

export function getDefaultEdition(editions: PricebookEdition[]) {
  return (
    editions.find((edition) => edition.year === 1404) ??
    [...editions].sort((first, second) => second.year - first.year)[0]
  );
}

export function getSnapshotString(snapshot: unknown, keys: string[]): string | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const record = snapshot as Record<string, unknown>;
  const value = keys
    .map((key) => record[key])
    .find((item) => item !== undefined && item !== null);

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return null;
}

export function getDocumentTotals(document: FinancialDocument | null): DocumentTotals {
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

export function isFinancialDocumentLocked(document: FinancialDocument | null): boolean {
  return document?.status === "locked" || Boolean(document?.locked_at);
}

export function getDocumentStatusLabel(
  status: FinancialDocument["status"] | undefined
): string {
  if (status === "locked") return "قفل‌شده";
  if (status === "calculated") return "محاسبه‌شده";
  if (status === "draft") return "پیش‌نویس";
  return status ?? "نامشخص";
}

export function getDocumentStatusTone(
  status: FinancialDocument["status"] | undefined
): "violet" | "emerald" | "amber" | "slate" {
  if (status === "locked") return "violet";
  if (status === "calculated") return "emerald";
  if (status === "draft") return "amber";
  return "slate";
}

export function omitEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function optionalDate(value: string): string | undefined {
  const trimmed = normalizeNumberInput(value);
  return trimmed ? trimmed : undefined;
}

export function parsePositiveInteger(value: string): number | null {
  const normalized = normalizeNumberInput(value);
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getDeprecatedConfiguredPriceSetId(): number | null {
  return parsePositiveInteger(import.meta.env.VITE_DEFAULT_PRICE_SET_ID ?? "");
}

export function getChapterNumber(chapterCode: string): number | null {
  const normalized = normalizeRowCode(chapterCode);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function matchesChapterFilter(
  chapter: PricebookChapter,
  filterId: string
): boolean {
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

export function normalizeQuantityValue(value: string): string {
  return normalizeNumberInput(value).replace(/[٬,]/g, "").replace(/٫/g, ".");
}

export function isPositiveDecimal(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && !/^0+(\.0+)?$/.test(value);
}

export function getCoefficientKeyLabel(key: string): string {
  return coefficientKeyOptions.find((item) => item.id === key)?.label ?? key;
}

export function getCoefficientScopeLabel(scope: string | undefined): string {
  return (
    coefficientScopeOptions.find((item) => item.id === scope)?.label ??
    scope ??
    "کل پروژه"
  );
}

export function hasManualUnitPrice(item: PricebookItemDetail): boolean {
  return (
    item.unit_price === null ||
    item.unit_price === "" ||
    item.rows.some(
      (row) =>
        row.requires_manual_unit_price ||
        row.unit_price === null ||
        row.unit_price === ""
    )
  );
}

export function getManualPriceValidationMessage(error: unknown): string {
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
        : "این آیتم نیازمند قیمت دستی است؛ لطفاً قیمت واحد را در فرم محاسبه وارد کنید.";
    }
  }

  return getApiErrorMessage(error);
}

export function getCalculationMessages(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const output = value as Record<string, unknown>;
  const candidates = [
    output.message,
    output.messages,
    output.warning,
    output.warnings,
    output.note,
    output.notes
  ];

  return candidates.flatMap((candidate) => {
    if (typeof candidate === "string" && candidate.trim()) {
      return [candidate.trim()];
    }

    if (Array.isArray(candidate)) {
      return candidate
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim());
    }

    return [];
  });
}
