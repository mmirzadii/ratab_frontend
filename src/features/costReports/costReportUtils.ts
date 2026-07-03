import type { FinancialDocument } from "../financialDocuments/financialDocumentApi";
import type {
  PricebookCalculateResponse,
  PricebookChapter,
  PricebookEdition,
  PricebookItemDetail,
  PricebookItemInputSpec
} from "../pricebooks/pricebookApi";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { normalizeNumberInput, normalizeRowCode } from "../../shared/utils/numberText";

import {
  chapterFilters,
  coefficientKeyOptions,
  coefficientScopeOptions,
  initialForm
} from "./constants";
import type { CostReportBuilderState, DocumentTotals, PricebookItemType, WizardFormState } from "./types";

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

// ---- v2 schema shapes (price_ranges and itemized_options are `unknown` in generated types) ----

export type PriceRangeEntry = {
  min_value: string | null;
  max_value: string | null;
};

export type PriceRangesShape = {
  value_key: number;
  ranges: Record<string, PriceRangeEntry>;
};

export type ItemizedOptionEntry = {
  short_name_fa: string;
  description_fa: string;
};

export type ItemizedOptionsShape = Record<string, ItemizedOptionEntry>;

export function parsePriceRanges(raw: unknown): PriceRangesShape | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r["value_key"] !== "number") return null;
  if (!r["ranges"] || typeof r["ranges"] !== "object" || Array.isArray(r["ranges"])) return null;
  const rawRanges = r["ranges"] as Record<string, unknown>;
  const ranges: Record<string, PriceRangeEntry> = {};
  for (const [code, entry] of Object.entries(rawRanges)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    ranges[code] = {
      min_value: typeof e["min_value"] === "string" ? e["min_value"] : null,
      max_value: typeof e["max_value"] === "string" ? e["max_value"] : null
    };
  }
  return Object.keys(ranges).length > 0 ? { value_key: r["value_key"] as number, ranges } : null;
}

export function parseItemizedOptions(raw: unknown): ItemizedOptionsShape | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const result: ItemizedOptionsShape = {};
  for (const [code, entry] of Object.entries(r)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    result[code] = {
      short_name_fa: typeof e["short_name_fa"] === "string" ? e["short_name_fa"] : "",
      description_fa: typeof e["description_fa"] === "string" ? e["description_fa"] : ""
    };
  }
  return Object.keys(result).length > 0 ? result : null;
}

export type SelectInputOptionSource = "schema-v3" | "itemized-options" | "rows" | "input-items";

export type SelectInputOption = {
  backendRowId: number | null;
  helper?: string;
  label: string;
  source: SelectInputOptionSource;
  value: string;
};

function getRecordString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function getInputRecord(input: PricebookItemInputSpec): Record<string, unknown> {
  return input as unknown as Record<string, unknown>;
}

function isInputSpecLike(value: unknown): value is PricebookItemInputSpec {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getPropertiesJsonRecord(item: PricebookItemDetail): Record<string, unknown> | null {
  const itemRecord = item as unknown as Record<string, unknown>;
  const propertiesJson = itemRecord["properties_json"];

  if (!propertiesJson || typeof propertiesJson !== "object" || Array.isArray(propertiesJson)) {
    return null;
  }

  return propertiesJson as Record<string, unknown>;
}

function getPropertiesJsonInputs(item: PricebookItemDetail): PricebookItemInputSpec[] {
  const propertiesJson = getPropertiesJsonRecord(item);
  if (!propertiesJson) {
    return [];
  }

  const inputs = propertiesJson["inputs"];
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs.filter(isInputSpecLike);
}

export function getRangeFallbackRow(
  item: PricebookItemDetail,
  preferredRowCode?: string | null
): PricebookItemDetail["rows"][number] | null {
  if (item.rows.length === 0) {
    return null;
  }

  const propertiesJson = getPropertiesJsonRecord(item);
  const rawRowIds = propertiesJson?.["row_ids"];
  const firstPropertiesRowCode =
    Array.isArray(rawRowIds) && rawRowIds.length > 0
      ? String(rawRowIds[0]).trim()
      : null;
  const fallbackRowCode = preferredRowCode?.trim() || firstPropertiesRowCode;

  if (fallbackRowCode) {
    const row = item.rows.find((candidate) => candidate.row_code === fallbackRowCode);
    if (row) {
      return row;
    }
  }

  return [...item.rows].sort((first, second) =>
    first.row_code.localeCompare(second.row_code)
  )[0];
}

export function isSelectInput(input: PricebookItemInputSpec): boolean {
  const record = getInputRecord(input);
  const items = record["items"];

  return (
    record["name"] === "selected_row" ||
    input.key === "selected_row" ||
    record["type"] === "select" ||
    input.data_type === "select" ||
    Array.isArray(items)
  );
}

export function getInputStateKey(input: PricebookItemInputSpec): string {
  const record = getInputRecord(input);
  const name =
    getRecordString(record, "name") ??
    getRecordString(record, "key") ??
    input.key ??
    input.label_fa ??
    "input";
  const kind = isSelectInput(input) ? "select" : "number";

  return `${name}:${kind}:${input.value_key}`;
}

function getInputMergeKey(input: PricebookItemInputSpec): string {
  const record = getInputRecord(input);
  const name =
    getRecordString(record, "name") ??
    getRecordString(record, "key") ??
    input.key ??
    input.label_fa ??
    String(input.value_key);
  const kind =
    getRecordString(record, "type") ??
    getRecordString(record, "data_type") ??
    input.data_type ??
    "number";

  return `${name}:${kind}`;
}

export function getCalculationInputs(item: PricebookItemDetail): PricebookItemInputSpec[] {
  const propertiesInputs = getPropertiesJsonInputs(item);
  if (propertiesInputs.length === 0) {
    return item.inputs;
  }

  const propertiesKeys = new Set(propertiesInputs.map(getInputMergeKey));
  const missingGeneratedInputs = item.inputs.filter(
    (input) => !propertiesKeys.has(getInputMergeKey(input))
  );

  return [...propertiesInputs, ...missingGeneratedInputs];
}

export function getSelectedRowInput(
  item: PricebookItemDetail
): PricebookItemInputSpec | null {
  return (
    getPropertiesJsonInputs(item).find(isSelectInput) ??
    item.inputs.find(isSelectInput) ??
    null
  );
}

export function getSelectOptionLabel(option: unknown): string {
  if (option && typeof option === "object" && !Array.isArray(option)) {
    const record = option as Record<string, unknown>;
    const shortName = record["short_name_fa"];
    if (typeof shortName === "string" && shortName) {
      return shortName;
    }

    const fallback =
      getRecordString(record, "label_fa") ??
      getRecordString(record, "title_fa") ??
      getRecordString(record, "description_fa") ??
      getRecordString(record, "long_description_fa");
    if (fallback) return fallback;
  }

  return "گزینه بدون عنوان";
}

export function resolveSelectedRowIdForBackend(
  optionRowCode: string,
  itemRows: PricebookItemDetail["rows"]
): number | null {
  const selectedRowCode = optionRowCode.trim();
  if (!selectedRowCode) {
    return null;
  }

  const byRowCode = itemRows.find((row) => row.row_code === selectedRowCode);
  if (byRowCode) {
    return byRowCode.id;
  }

  const byDirectId = itemRows.find((row) => String(row.id) === selectedRowCode);
  return byDirectId?.id ?? null;
}

function getInputItems(input: PricebookItemInputSpec): unknown[] {
  const items = getInputRecord(input)["items"];
  return Array.isArray(items) ? items : [];
}

function getSelectInputOptionsFromItems(
  input: PricebookItemInputSpec,
  item: PricebookItemDetail | undefined,
  source: SelectInputOptionSource
): SelectInputOption[] {
  const items = getInputItems(input);
  if (items.length === 0) {
    return [];
  }

  return items.flatMap((option): SelectInputOption[] => {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      return [];
    }

    const record = option as Record<string, unknown>;
    const rowCode =
      getRecordString(record, "row_id") ??
      getRecordString(record, "row_code") ??
      getRecordString(record, "value");

    if (!rowCode) {
      return [];
    }

    return [
      {
        backendRowId: item ? resolveSelectedRowIdForBackend(rowCode, item.rows) : null,
        helper:
          getRecordString(record, "long_description_fa") ??
          getRecordString(record, "description_fa") ??
          undefined,
        label:
          getRecordString(record, "short_name_fa") ??
          getSelectOptionLabel(option),
        source,
        value: rowCode
      }
    ];
  });
}

export function getSelectedRowOptions(item: PricebookItemDetail): SelectInputOption[] {
  const selectedRowInput = getSelectedRowInput(item);
  const schemaOptions = selectedRowInput
    ? getSelectInputOptionsFromItems(selectedRowInput, item, "schema-v3")
    : [];

  if (schemaOptions.length > 0) {
    return schemaOptions;
  }

  const itemizedOptions = parseItemizedOptions(item.itemized_options);
  if (itemizedOptions) {
    const options = Object.entries(itemizedOptions).flatMap(
      ([rowCode, option]): SelectInputOption[] => {
        const row = item.rows.find((candidate) => candidate.row_code === rowCode);
        if (!row) {
          return [];
        }

        return [
          {
            backendRowId: row.id,
            helper: option.description_fa || undefined,
            label:
              option.short_name_fa ||
              row.short_title_fa ||
              row.title_fa ||
              row.description_fa ||
              row.row_code,
            source: "itemized-options",
            value: row.row_code
          }
        ];
      }
    );

    if (options.length > 0) {
      return options;
    }
  }

  return item.rows.map((row) => ({
    backendRowId: row.id,
    helper: row.description_fa || undefined,
    label: row.short_title_fa || row.title_fa || row.description_fa || row.row_code,
    source: "rows",
    value: row.row_code
  }));
}

export function getSelectInputOptions(
  input: PricebookItemInputSpec,
  item?: PricebookItemDetail
): SelectInputOption[] {
  if (item && isSelectInput(input)) {
    const directOptions = getSelectInputOptionsFromItems(input, item, "schema-v3");
    return directOptions.length > 0 ? directOptions : getSelectedRowOptions(item);
  }

  return getSelectInputOptionsFromItems(input, item, "input-items");
}

export function findMatchedRangeRow(
  priceRanges: PriceRangesShape,
  drivingValue: string,
  rows: PricebookItemDetail["rows"]
): PricebookItemDetail["rows"][number] | null {
  const numVal = Number(drivingValue);
  if (!Number.isFinite(numVal) || numVal <= 0) return null;
  for (const [rowCode, range] of Object.entries(priceRanges.ranges)) {
    const min = range.min_value !== null ? Number(range.min_value) : -Infinity;
    const max = range.max_value !== null ? Number(range.max_value) : Infinity;
    if (numVal >= min && numVal <= max) {
      return rows.find((r) => r.row_code === rowCode) ?? null;
    }
  }
  return null;
}

export function classifyPricebookItem(item: PricebookItemDetail): PricebookItemType {
  if ((item.schema_version ?? 1) <= 1) return "single";
  if (item.is_itemized) return "itemized";
  if (parsePriceRanges(item.price_ranges) !== null) return "range-based";
  if (item.inputs && item.inputs.length > 0) return "multi-input";
  return "single";
}

export function hasManualUnitPrice(item: PricebookItemDetail): boolean {
  return item.requires_manual_unit_price === true;
}

export function requiresRowSelection(item: PricebookItemDetail): boolean {
  return item.requires_row_selection === true;
}

export function getManualPriceValidationMessage(error: unknown): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === "object" && data !== null) {
      const d = data as Record<string, unknown>;

      if (d["requires_row_selection"] === true || String(d["requires_row_selection"]) === "True") {
        return typeof d["detail"] === "string"
          ? d["detail"]
          : "این آیتم چند ردیف دارد؛ ردیف موردنظر را انتخاب کنید.";
      }

      if (d["requires_manual_unit_price"] === true || String(d["requires_manual_unit_price"]) === "True") {
        return typeof d["detail"] === "string"
          ? d["detail"]
          : "این آیتم نیازمند قیمت دستی است؛ لطفاً قیمت واحد را در فرم محاسبه وارد کنید.";
      }
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

function normalizeForStableKey(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForStableKey);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalizeForStableKey((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

export function stablePayloadKey(value: unknown): string {
  return JSON.stringify(normalizeForStableKey(value));
}

export function formatInputLabel(
  label: string,
  unit?: string | null,
  isSelect = false
): string {
  const trimmedLabel = label.trim();
  const trimmedUnit = unit?.trim();

  if (isSelect || !trimmedUnit || trimmedLabel.includes(trimmedUnit)) {
    return trimmedLabel;
  }

  return `${trimmedLabel} (${trimmedUnit})`;
}

function hasNonZeroNumericValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) && numeric !== 0;
}

function getCustomPriceRowCodes(calculation: PricebookCalculateResponse): Set<string> {
  const record = calculation as unknown as Record<string, unknown>;
  const value = record["custom_price_row_codes"] ?? record["custom_price_rows"];

  if (!Array.isArray(value)) {
    return new Set();
  }

  return new Set(
    value
      .filter((rowCode): rowCode is string | number => {
        return typeof rowCode === "string" || typeof rowCode === "number";
      })
      .map((rowCode) => String(rowCode))
  );
}

function isCustomPriceSource(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("custom") ||
    normalized.includes("manual") ||
    normalized.includes("starred") ||
    normalized.includes("دستی")
  );
}

export type DisplayCalculationRow = {
  rowId: number | null;
  rowCode: string | null;
  title: string;
  unit: string | null;
  unitPrice: string | null;
  quantity: string;
  total: string;
  priceSource: string | null;
  isCustomPrice: boolean;
};

export function getVisibleCalculationRows(
  calculation: PricebookCalculateResponse,
  itemRows: PricebookItemDetail["rows"] = [],
  localCustomPriceRowCodes: readonly string[] = []
): DisplayCalculationRow[] {
  const rowsById = new Map(itemRows.map((row) => [row.id, row]));
  const rowsByCode = new Map(itemRows.map((row) => [row.row_code, row]));
  const customPriceRowCodes = new Set([
    ...getCustomPriceRowCodes(calculation),
    ...localCustomPriceRowCodes
  ]);

  const breakdownRows =
    calculation.rows_breakdown?.map((row) => {
      const itemRow = rowsById.get(row.row_id) ?? rowsByCode.get(row.row_code);
      const priceSource = getRecordString(row as unknown as Record<string, unknown>, "price_source");

      return {
        rowId: row.row_id,
        rowCode: row.row_code,
        title:
          row.description_fa ||
          row.title_fa ||
          itemRow?.description_fa ||
          itemRow?.title_fa ||
          itemRow?.short_title_fa ||
          "ردیف انتخاب‌شده",
        unit: row.unit,
        unitPrice: row.unit_price,
        quantity: row.quantity,
        total: row.total,
        priceSource,
        isCustomPrice:
          isCustomPriceSource(priceSource) ||
          (row.row_code ? customPriceRowCodes.has(row.row_code) : false)
      };
    }) ?? [];

  const activeBreakdownRows = breakdownRows.filter(
    (row) => hasNonZeroNumericValue(row.quantity) || hasNonZeroNumericValue(row.total)
  );

  if (activeBreakdownRows.length > 0) {
    return activeBreakdownRows;
  }

  if (breakdownRows.length > 0) {
    return breakdownRows;
  }

  const fallbackRow =
    rowsById.get(calculation.row_id ?? -1) ?? rowsByCode.get(calculation.row_code ?? "");
  const calculationRecord = calculation as unknown as Record<string, unknown>;
  const fallbackPriceSource = getRecordString(calculationRecord, "price_source");
  const fallbackRowCode = calculation.row_code ?? fallbackRow?.row_code ?? null;

  return [
    {
      rowId: calculation.row_id ?? fallbackRow?.id ?? null,
      rowCode: fallbackRowCode,
      title:
        fallbackRow?.description_fa ||
        fallbackRow?.title_fa ||
        fallbackRow?.short_title_fa ||
        "ردیف انتخاب‌شده",
      unit: calculation.unit ?? fallbackRow?.unit ?? null,
      unitPrice: calculation.unit_price ?? fallbackRow?.unit_price ?? null,
      quantity: calculation.quantity,
      total: calculation.total_amount,
      priceSource: fallbackPriceSource,
      isCustomPrice:
        isCustomPriceSource(fallbackPriceSource) ||
        (fallbackRowCode ? customPriceRowCodes.has(fallbackRowCode) : false)
    }
  ];
}
