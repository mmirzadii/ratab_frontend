# Frontend Phase 11 Report

Status: **completed** (2026-07-31)

## Understanding

Phase 11 integrates the Backend Phase 11 family/year pricebook contract into the existing cost-report Document Info step without redesigning unrelated wizard, calculation, billing, messaging, or workspace behavior.

## Contract sync

- Copied `ratab_backend/codexphaze/frontend_docs/` → `backend_docs/current/` (hashes matched after copy).
- Regenerated OpenAPI types (`npm run generate:api`).
- Pricebook schema now includes: `title_fa`, `official_title_fa`, `base_year`, `sort_order`, `latest_available_year`.
- Edition schema includes: `family_code`, `family_title_fa`, `year`, `is_active`, `is_stale`, `is_base_year`, `active_price_set`.
- Corrected a spectacular regression in the copied OpenAPI where `GroupMessage.attachments` was typed as `string` and `ForwardedFrom` was missing (restored array + `$ref` from the prior Phase 10 contract so messaging types remain valid). Generated `schema.ts` was not hand-edited.

## Final UI fields

| Field | Label | Source |
| --- | --- | --- |
| Family | `نوع فهرست‌بها` | `GET /api/pricebooks/` → `title_fa` only |
| Year | `سال` | `GET /api/pricebooks/{id}/editions/` → numeric `year`, newest first |
| Submit | — | exact `pricebook_edition_id` + edition `active_price_set.id` |

## Selection algorithm (new document)

1. Load active families; sort by backend `sort_order` (stable `id` tie-break).
2. Keep an explicit valid user family selection; otherwise first family in that order (no hardcoded `building` / year-encoded legacy codes).
3. Load editions for the selected family only.
4. Default year = `latest_available_year` when present among usable editions; else maximum usable year.
5. Usable = `is_active && !is_stale && active_price_set.is_active`.
6. Family change clears edition/chapter/group and selects the new family's newest usable year.
7. Stale responses are ignored by filtering `edition.pricebook_id === selectedFamily.id`.

## Existing document

- Family/year become read-only after create (`document-info-*-readonly`).
- Saved edition is resolved across families; browse continues via `pricebook_edition_id`.
- No auto-upgrade to a newer year.

## Legacy removed

- `getPricebookFamilies` / string family ids / `pricebook_family_code` / `pricebook_persian_name` authority.
- Deriving families from edition titles.
- Hardcoded default edition year `1404` as selection authority.
- Old Document Info label `فهرست‌بها` → `نوع فهرست‌بها`.

`VITE_DEFAULT_PRICE_SET_ID` remains only behind the existing gated `isDevPriceSetConfirmed` path and does not override a valid official `active_price_set`.

## Files changed (focused)

- `backend_docs/current/*` (Phase 11 sync + GroupMessage OpenAPI correction)
- `src/shared/api/generated/schema.ts` (regenerated)
- `src/features/pricebooks/pricebookApi.ts`
- `src/features/costReports/pricebookFamilyYear.ts` (+ test)
- `src/features/costReports/components/DocumentInfoSection.tsx`
- `src/features/costReports/costReportUtils.ts` (`getDefaultEdition` deprecated wrapper)
- `src/pages/CostReportWizardPage.tsx`
- `package.json` (`test:pricebook-family-year`)
- Phase 11 / project summary docs

## Live verification (local)

- Family select shows **ابنیه** only (no year / no `ABN1404`).
- Year select shows **1404** (only imported year in live `data/building_pricebook/`; defaults to newest existing).
- Created document `آزمایش فاز ۱۱` with edition id `1` / price set `official-1404`.
- Reopened Document step: read-only **ابنیه** / **1404**, helper about immutability, no dropdowns.
- Pricebook browser chapters loaded for the saved edition.
- Live catalog currently has **one family / one year**; multi-family and multi-year switching covered by unit tests with Phase 11 response shapes. Additional families/years require backend data import.

## Contract gaps / notes

- Backend does not expose an explicit `is_default` family flag; frontend uses `sort_order` first active family (building is first because backend `sort_order=10`, not because of hardcoded matching).
- Live data does not yet include mechanical/electrical or non-1404 years.

Stop after Frontend Phase 11. No commit/push.
