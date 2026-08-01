import type { FinancialDocument, FinancialDocumentPricebook } from "../financialDocuments/financialDocumentApi";
import type { Pricebook, PricebookEdition } from "../pricebooks/pricebookApi";

/** Draft picker entry before the FinancialDocument exists. */
export type DraftPricebookPick = {
  editionId: number;
  familyTitleFa: string;
  year: number;
};

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

export function formatPricebookSelectionLabel(input: {
  familyTitleFa: string;
  year: number;
}): string {
  const title = input.familyTitleFa.trim() || "—";
  return `${title} — ${toPersianDigits(input.year)}`;
}

/**
 * Authoritative selected-pricebooks list from the document response.
 * Falls back to legacy singular edition/set fields for older payloads.
 */
export function resolveDocumentSelectedPricebooks(
  document: FinancialDocument | null | undefined
): FinancialDocumentPricebook[] {
  if (!document) return [];
  const fromApi = document.selected_pricebooks;
  if (Array.isArray(fromApi) && fromApi.length > 0) {
    return [...fromApi].sort((first, second) => first.sort_order - second.sort_order || first.id - second.id);
  }
  if (document.pricebook_edition_id != null && document.price_set_id != null) {
    // Legacy singular payload: id 0 is local-only and must never be sent as document_pricebook_id.
    return [
      {
        id: 0,
        pricebook_edition_id: document.pricebook_edition_id,
        family_code: "",
        family_title_fa: "فهرست‌بها",
        year: 0,
        price_set_id: document.price_set_id,
        price_set_code: "",
        is_edition_active: true,
        is_edition_stale: false,
        is_base_year: false,
        sort_order: 0,
        created_at: document.created_at
      }
    ];
  }
  return [];
}

export function reconcileActiveDocumentPricebookId(
  selections: readonly FinancialDocumentPricebook[],
  currentId: number | null | undefined
): number | null {
  if (selections.length === 0) return null;
  if (currentId != null && selections.some((item) => item.id === currentId)) {
    return currentId;
  }
  return selections[0]?.id ?? null;
}

export function formatDocumentPricebookRemoveError(
  error: unknown,
  fallback = "حذف فهرست‌بها از صورت‌بها انجام نشد."
): string {
  if (!error || typeof error !== "object") return fallback;
  const data = (error as { data?: unknown }).data;
  const texts: string[] = [];
  if (typeof data === "string") texts.push(data);
  else if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["detail", "non_field_errors", "selection_id", "pricebook_edition_id"]) {
      const value = record[key];
      if (typeof value === "string") texts.push(value);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") texts.push(item);
        }
      }
    }
  }
  const joined = texts.join(" ").toLowerCase();
  if (/line|ردیف|has lines|referenced/.test(joined)) {
    return "این فهرست‌بها ردیف دارد و تا وقتی ردیف‌هایش حذف نشده‌اند قابل حذف نیست.";
  }
  if (/last|final|only|آخرین|تنها/.test(joined)) {
    return "حداقل یک فهرست‌بها باید روی صورت‌بها باقی بماند.";
  }
  if (/lock|locked|نهایی|قفل/.test(joined)) {
    return "صورت‌بهای قفل‌شده قابل تغییر فهرست‌بها نیست.";
  }
  if (/inactive|stale|منسوخ|غیرفعال/.test(joined)) {
    return "نسخه فهرست‌بهای انتخاب‌شده دیگر قابل استفاده نیست.";
  }
  if (texts.length > 0 && !/<html|<!doctype/i.test(joined)) {
    return texts[0]!;
  }
  return fallback;
}

/** Active families in backend sort_order (stable id tie-break). */
export function sortActivePricebookFamilies(
  pricebooks: readonly Pricebook[]
): Pricebook[] {
  return pricebooks
    .filter((pricebook) => pricebook.is_active)
    .slice()
    .sort((first, second) => {
      if (first.sort_order !== second.sort_order) {
        return first.sort_order - second.sort_order;
      }
      return first.id - second.id;
    });
}

/**
 * Default family for a new document.
 * Prefer an explicit valid selection; otherwise first family in backend sort order.
 * Do not hardcode legacy year-encoded family codes or a single discipline.
 */
export function selectDefaultPricebookFamily(
  families: readonly Pricebook[],
  preferredFamilyId?: number | null
): Pricebook | undefined {
  if (preferredFamilyId != null) {
    const preferred = families.find((family) => family.id === preferredFamilyId);
    if (preferred) return preferred;
  }
  return families[0];
}

/** Editions usable when creating a new FinancialDocument. */
export function isUsableEditionForNewDocument(edition: PricebookEdition): boolean {
  return (
    edition.is_active &&
    !edition.is_stale &&
    edition.active_price_set != null &&
    edition.active_price_set.is_active === true
  );
}

export function sortEditionsByYearDesc(
  editions: readonly PricebookEdition[]
): PricebookEdition[] {
  return editions.slice().sort((first, second) => {
    if (first.year !== second.year) {
      return second.year - first.year;
    }
    return second.id - first.id;
  });
}

export function listUsableEditionsForFamily(
  editions: readonly PricebookEdition[],
  familyId: number
): PricebookEdition[] {
  return sortEditionsByYearDesc(
    editions.filter(
      (edition) =>
        edition.pricebook_id === familyId && isUsableEditionForNewDocument(edition)
    )
  );
}

/**
 * Newest year that actually exists for the family.
 * Prefer family.latest_available_year when that year is present in usable editions;
 * otherwise the highest numeric year among usable editions. Never hardcode 1404.
 */
export function selectDefaultEditionForFamily(
  editions: readonly PricebookEdition[],
  family: Pick<Pricebook, "id" | "latest_available_year"> | null | undefined,
  preferredEditionId?: number | null
): PricebookEdition | undefined {
  if (!family) return undefined;
  const usable = listUsableEditionsForFamily(editions, family.id);
  if (usable.length === 0) return undefined;

  if (preferredEditionId != null) {
    const preferred = usable.find((edition) => edition.id === preferredEditionId);
    if (preferred) return preferred;
  }

  if (family.latest_available_year != null) {
    const byLatest = usable.find(
      (edition) => edition.year === family.latest_available_year
    );
    if (byLatest) return byLatest;
  }

  return usable[0];
}

/** Family/year display for an existing document's saved edition (immutable). */
export function describeSavedEdition(edition: PricebookEdition | null | undefined): {
  familyTitleFa: string;
  year: number | null;
} {
  if (!edition) {
    return { familyTitleFa: "—", year: null };
  }
  return {
    familyTitleFa: edition.family_title_fa?.trim() || "—",
    year: edition.year
  };
}

export function editionBelongsToFamily(
  edition: PricebookEdition | null | undefined,
  familyId: number | null | undefined
): boolean {
  return edition != null && familyId != null && edition.pricebook_id === familyId;
}

export function priceSetBelongsToEdition(
  edition: PricebookEdition | null | undefined,
  priceSetId: number | null | undefined
): boolean {
  if (!edition || priceSetId == null) return false;
  return edition.active_price_set?.id === priceSetId;
}

/** Map create-document edition validation errors to concise Persian copy. */
export function formatPricebookEditionCreateError(
  error: unknown,
  fallback = "ایجاد صورت‌بها انجام نشد."
): string {
  if (!error || typeof error !== "object") return fallback;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  const editionErrors = record.pricebook_edition_id;
  const texts: string[] = [];
  if (typeof editionErrors === "string") texts.push(editionErrors);
  if (Array.isArray(editionErrors)) {
    for (const item of editionErrors) {
      if (typeof item === "string") texts.push(item);
    }
  }
  const joined = texts.join(" ").toLowerCase();
  if (/inactive|stale|غیرفعال|منسوخ/.test(joined)) {
    return "سال فهرست‌بهای انتخاب‌شده دیگر برای صورت‌بهای جدید قابل استفاده نیست. سال دیگری انتخاب کنید.";
  }
  if (texts.length > 0) {
    return "شناسه نسخه فهرست‌بها معتبر نیست. نوع و سال را دوباره انتخاب کنید.";
  }
  const priceSetErrors = record.price_set_id;
  if (
    typeof priceSetErrors === "string" ||
    (Array.isArray(priceSetErrors) && priceSetErrors.length > 0)
  ) {
    return "مجموعه قیمت با نسخه فهرست‌بهای انتخاب‌شده هم‌خوان نیست.";
  }
  return fallback;
}
