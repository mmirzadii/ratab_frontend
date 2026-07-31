import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Pricebook, PricebookEdition } from "../pricebooks/pricebookApi.ts";
import {
  describeSavedEdition,
  editionBelongsToFamily,
  formatPricebookEditionCreateError,
  isUsableEditionForNewDocument,
  listUsableEditionsForFamily,
  priceSetBelongsToEdition,
  selectDefaultEditionForFamily,
  selectDefaultPricebookFamily,
  sortActivePricebookFamilies,
  sortEditionsByYearDesc
} from "./pricebookFamilyYear.ts";

const here = import.meta.dirname!;

function family(partial: Partial<Pricebook> & Pick<Pricebook, "id" | "code" | "title_fa">): Pricebook {
  return {
    base_year: 1404,
    discipline: partial.code,
    is_active: true,
    latest_available_year: 1404,
    official_title_fa: `فهرست‌بهای واحد پایه رشته ${partial.title_fa}`,
    sort_order: 10,
    ...partial
  };
}

function edition(
  partial: Partial<PricebookEdition> &
    Pick<PricebookEdition, "id" | "pricebook_id" | "year" | "family_code" | "family_title_fa">
): PricebookEdition {
  const year = partial.year;
  return {
    active_price_set: {
      id: year,
      code: `official-${year}`,
      title_fa: `قیمت‌های رسمی سال ${year}`,
      is_active: true
    },
    code: `${partial.family_code}-${year}`,
    currency_code: "IRR",
    is_active: true,
    is_base_year: year === 1404,
    is_locked: true,
    is_stale: false,
    title_fa: `فهرست‌بهای واحد پایه رشته ${partial.family_title_fa} سال ${year}`,
    ...partial
  };
}

describe("Phase 11 pricebook family/year selection", () => {
  const building = family({
    id: 1,
    code: "building",
    title_fa: "ابنیه",
    sort_order: 10,
    latest_available_year: 1405
  });
  const mechanical = family({
    id: 2,
    code: "mechanical",
    title_fa: "تأسیسات مکانیکی",
    sort_order: 20,
    latest_available_year: 1403
  });
  const electrical = family({
    id: 3,
    code: "electrical",
    title_fa: "تأسیسات برقی",
    sort_order: 30,
    latest_available_year: 1404,
    is_active: false
  });

  const buildingEditions = [
    edition({
      id: 11,
      pricebook_id: 1,
      year: 1404,
      family_code: "building",
      family_title_fa: "ابنیه"
    }),
    edition({
      id: 12,
      pricebook_id: 1,
      year: 1405,
      family_code: "building",
      family_title_fa: "ابنیه"
    }),
    edition({
      id: 10,
      pricebook_id: 1,
      year: 1403,
      family_code: "building",
      family_title_fa: "ابنیه"
    })
  ];

  const mechanicalEditions = [
    edition({
      id: 21,
      pricebook_id: 2,
      year: 1403,
      family_code: "mechanical",
      family_title_fa: "تأسیسات مکانیکی"
    })
  ];

  it("sorts active families by backend sort_order without privileging ABN1404", () => {
    const sorted = sortActivePricebookFamilies([electrical, mechanical, building]);
    assert.deepEqual(
      sorted.map((item) => item.code),
      ["building", "mechanical"]
    );
    assert.equal(
      sorted.some((item) => item.code === "ABN1404" || item.title_fa.includes("1404")),
      false
    );
  });

  it("family labels stay short Persian titles without embedded years", () => {
    for (const item of [building, mechanical]) {
      assert.match(item.title_fa, /^(ابنیه|تأسیسات مکانیکی|تأسیسات برقی)$/);
      assert.doesNotMatch(item.title_fa, /140\d|ABN/);
      assert.ok(item.official_title_fa.includes(item.title_fa));
    }
  });

  it("defaults to the newest year that actually exists for the family", () => {
    const selected = selectDefaultEditionForFamily(buildingEditions, building);
    assert.equal(selected?.year, 1405);
    assert.equal(selected?.id, 12);
  });

  it("does not hardcode 1404 when a newer year exists", () => {
    const selected = selectDefaultEditionForFamily(buildingEditions, {
      id: 1,
      latest_available_year: 1405
    });
    assert.notEqual(selected?.year, 1404);
    assert.equal(selected?.year, 1405);
  });

  it("falls back to max usable year when latest_available_year is missing from editions", () => {
    const selected = selectDefaultEditionForFamily(buildingEditions, {
      id: 1,
      latest_available_year: 1410
    });
    assert.equal(selected?.year, 1405);
  });

  it("changing family selects that family's newest year, not the previous family's year", () => {
    const afterSwitch = selectDefaultEditionForFamily(
      [...buildingEditions, ...mechanicalEditions],
      mechanical
    );
    assert.equal(afterSwitch?.pricebook_id, 2);
    assert.equal(afterSwitch?.year, 1403);
    assert.equal(afterSwitch?.family_title_fa, "تأسیسات مکانیکی");
  });

  it("filters editions to the selected family and sorts years descending", () => {
    const years = listUsableEditionsForFamily(
      [...buildingEditions, ...mechanicalEditions],
      1
    ).map((item) => item.year);
    assert.deepEqual(years, [1405, 1404, 1403]);
  });

  it("rejects stale/inactive editions for new documents", () => {
    const stale = edition({
      id: 99,
      pricebook_id: 1,
      year: 1406,
      family_code: "building",
      family_title_fa: "ابنیه",
      is_stale: true
    });
    assert.equal(isUsableEditionForNewDocument(stale), false);
    assert.equal(
      selectDefaultEditionForFamily([...buildingEditions, stale], building)?.year,
      1405
    );
  });

  it("preserves an existing document edition and never auto-upgrades year", () => {
    const saved = buildingEditions.find((item) => item.year === 1403)!;
    const described = describeSavedEdition(saved);
    assert.equal(described.familyTitleFa, "ابنیه");
    assert.equal(described.year, 1403);
    const preferred = selectDefaultEditionForFamily(buildingEditions, building, saved.id);
    assert.equal(preferred?.id, saved.id);
    assert.equal(preferred?.year, 1403);
  });

  it("validates edition/family/price-set consistency before submit", () => {
    const selected = buildingEditions[1];
    assert.equal(editionBelongsToFamily(selected, 1), true);
    assert.equal(editionBelongsToFamily(selected, 2), false);
    assert.equal(priceSetBelongsToEdition(selected, selected.active_price_set!.id), true);
    assert.equal(priceSetBelongsToEdition(selected, 999), false);
  });

  it("maps inactive/stale create errors to Persian copy", () => {
    const message = formatPricebookEditionCreateError({
      data: {
        pricebook_edition_id: [
          "Pricebook edition is inactive or stale and cannot be used for new documents."
        ]
      }
    });
    assert.match(message, /سال فهرست‌بها/);
    assert.doesNotMatch(message, /Pricebook edition is inactive/);
  });

  it("preserves explicit family selection when still valid", () => {
    assert.equal(
      selectDefaultPricebookFamily([building, mechanical], mechanical.id)?.code,
      "mechanical"
    );
    assert.equal(selectDefaultPricebookFamily([building, mechanical], null)?.code, "building");
  });

  it("sortEditionsByYearDesc is numeric and descending", () => {
    assert.deepEqual(
      sortEditionsByYearDesc(buildingEditions).map((item) => item.year),
      [1405, 1404, 1403]
    );
  });
});

describe("Phase 11 UI wiring (route-rendered wizard)", () => {
  const wizard = readFileSync(join(here, "../../pages/CostReportWizardPage.tsx"), "utf8");
  const documentInfo = readFileSync(join(here, "components/DocumentInfoSection.tsx"), "utf8");
  const pricebookApi = readFileSync(join(here, "../pricebooks/pricebookApi.ts"), "utf8");
  const selection = readFileSync(join(here, "pricebookFamilyYear.ts"), "utf8");

  it("DocumentInfoSection labels and short family titles", () => {
    assert.match(documentInfo, /نوع فهرست‌بها/);
    assert.match(documentInfo, /aria-label="سال"/);
    assert.match(documentInfo, /family\.title_fa/);
    assert.match(documentInfo, /edition\.year/);
    assert.doesNotMatch(documentInfo, /ABN1404/);
    assert.doesNotMatch(documentInfo, /aria-label="فهرست‌بها"/);
  });

  it("existing documents are read-only for family/year", () => {
    assert.match(documentInfo, /isExistingDocument/);
    assert.match(documentInfo, /document-info-family-readonly/);
    assert.match(documentInfo, /document-info-year-readonly/);
    assert.match(documentInfo, /پس از ایجاد صورت‌بها ثابت می‌ماند/);
  });

  it("wizard uses generated family list + per-family editions and selection helpers", () => {
    assert.match(wizard, /sortActivePricebookFamilies/);
    assert.match(wizard, /selectDefaultEditionForFamily/);
    assert.match(wizard, /useListPricebookEditionsQuery/);
    assert.match(wizard, /pricebook_edition_id: selectedEdition\.id/);
    assert.doesNotMatch(wizard, /getPricebookFamilies/);
    assert.doesNotMatch(wizard, /ABN1404/);
    assert.doesNotMatch(wizard, /getDefaultEdition\(/);
  });

  it("pricebookApi no longer treats ABN1404 / legacy family_code as authority", () => {
    assert.doesNotMatch(pricebookApi, /ABN1404/);
    assert.doesNotMatch(pricebookApi, /pricebook_family_code/);
    assert.doesNotMatch(pricebookApi, /pricebook_persian_name/);
    assert.doesNotMatch(pricebookApi, /getPricebookFamilies/);
  });

  it("selection helpers reject hardcoded year-as-family authority", () => {
    assert.doesNotMatch(selection, /ABN1404/);
    assert.doesNotMatch(selection, /code\s*===\s*["']building["']/);
    assert.match(selection, /latest_available_year/);
    assert.match(selection, /Never hardcode 1404/);
  });
});
