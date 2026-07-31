import type { Pricebook, PricebookEdition } from "../pricebooks/pricebookApi";

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
