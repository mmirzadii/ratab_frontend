# Frontend Phase 6 Report

## Summary

Status: done.

Phase 6 implemented the real pricebook item modal calculation flow inside the existing cost-report wizard. The latest focused follow-up removes reliance on `VITE_DEFAULT_PRICE_SET_ID` from the normal path by using the selected edition's backend-provided `active_price_set.id` for draft financial document creation and add-to-document flow.

## Scope

- Implemented only frontend Phase 6 follow-up behavior.
- Used the required backend API contract from:

```text
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```

- Used only documented pricebook and financial document endpoints:

```text
POST /api/pricebook-items/{id}/calculate/
POST /api/projects/{id}/financial-documents/
POST /api/financial-documents/{id}/lines/
POST /api/financial-documents/{id}/recalculate/
```

- Did not create backend code.
- Did not implement full Phase 8.
- Did not add coefficient selection UI.
- Did not change Docker files or deployment configuration.

## Files Created

- `code_oder/v0.0/phaze6/REPORT.md`
- `code_oder/v0.0/phaze6/TEST_RESULTS.md`

## Files Modified

- `backend_docs/v0.0/frontend_handoff_v0_0.md`
- `backend_docs/v0.0/openapi_v0_0.yaml`
- `backend_docs/v0.0/ratab v0.0 Backend API.yaml`
- `src/shared/api/generated/schema.ts`
- `src/pages/CostReportWizardPage.tsx`
- `src/shared/components/GuidedTour.tsx`
- `src/vite-env.d.ts`
- `.env.example`

Existing Phase 6 files from earlier work also include:

- `src/features/pricebooks/pricebookApi.ts`
- `src/features/financialDocuments/financialDocumentApi.ts`

## Implementation Details

- Synced frontend backend docs/schema with the backend OpenAPI version that exposes `active_price_set` on pricebook editions.
- Regenerated TypeScript API types from the required spaced schema file.
- Added/used generated `ActivePriceSet` and `PricebookEdition.active_price_set` types.
- Updated the wizard so the selected ABN1404 / 1404 edition provides the internal `price_set_id` through `selectedEdition.active_price_set.id`.
- Removed `VITE_DEFAULT_PRICE_SET_ID` from the normal document creation path.
- Kept `VITE_DEFAULT_PRICE_SET_ID` only as a deprecated hidden development fallback under the advanced development disclosure.
- If the selected edition has no active price set, the wizard shows: `برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.`
- Pricebook chapter/group/item browsing remains available even when `active_price_set` is missing.
- Draft financial document creation uses the selected edition's active price set when available.
- After a successful backend calculation, `افزودن به صورت‌بها` is enabled only when:
  - a calculation exists;
  - a real financial document id exists;
  - the item is not a blocked manual/starred-price row.
- Existing Phase 6 calculation behavior remains intact:
  - quantity input normalizes Persian/Arabic digits before submission;
  - backend calculation results are displayed as strings;
  - missing official prices are never treated as zero;
  - manual/starred-price rows remain blocked until backend support exists;
  - line creation submits only the documented payload: `pricebook_item_id` and `quantity`.

## UI/UX Notes

- UI remains Persian-first and RTL.
- Normal UI shows user-friendly pricebook/year labels and does not expose raw backend ids.
- The active price-set lookup is internal and driven by the selected edition response.
- The advanced fallback remains hidden and marked as development-only.
- The current cost-report panel continues to show added lines and backend totals when available.
- The item modal keeps the dark glassmorphism and emerald/amber visual language.

## API Contract Notes

- No API endpoints were invented.
- The backend remains the source of truth for financial document creation, item calculation, line creation, recalculation, and totals.
- The frontend now depends on `PricebookEdition.active_price_set` from the backend schema.
- `POST /api/pricebook-items/{id}/calculate/` still does not accept `price_set_id`; the frontend does not send it there.
- `POST /api/projects/{id}/financial-documents/` still requires `price_set_id`; the frontend now derives it from `selectedEdition.active_price_set.id`.
- If `active_price_set` is `null`, document creation is skipped while browsing/calculation stays available.

## Docker / Online Dev Deployment Notes

Docker files were not changed in Phase 6.

Docker build was not required because `docker/`, `.dockerignore`, and compose files were unchanged.

## Issues and Findings

- Target backend deployments must include the active-price-set edition response. Older backend deployments will still allow browsing and calculation but cannot create a normal draft document without the hidden fallback.
- Manual/starred-price calculation remains intentionally blocked until backend support exists.
- No frontend test runner or test script is configured in `package.json`.
- Manual browser verification was not run in this environment.

## Risks and Assumptions

- Assumed `backend_docs/v0.0/ratab v0.0 Backend API.yaml` is the authoritative contract.
- Assumed ABN1404 / 1404 has an active price set in the target backend data.
- Assumed keeping the deprecated hidden fallback is acceptable for temporary internal testing across older dev environments.
- Assumed coefficient selection belongs to a later frontend phase.
- Assumed full Phase 8 document editing remains future work; this follow-up only keeps the minimal documented line-add bridge after calculation.

## User Actions Required

- Deploy or run the frontend against a backend that includes `active_price_set` in pricebook edition responses.
- Manually open the cost-report wizard in a browser and verify ABN1404 / 1404 is selected.
- Confirm the normal flow creates a draft financial document without opening advanced development settings.
- Calculate at least one priced item and confirm totals match the backend response.
- Click `افزودن به صورت‌بها` and confirm the line appears in the current cost-report list.
- Test an edition with no active price set, if available, and confirm browsing remains enabled while the Persian setup message appears.
- Test a missing/manual-price item and confirm calculation/add-to-document stay blocked without submitting zero.

## Suggested Commit Message

fix(frontend-phase6): use backend active price set for documents

## Next Step

After browser review, proceed only with the next approved frontend phase.
