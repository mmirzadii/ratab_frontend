# Frontend Phase 6 Report

## Summary

Status: done.

Phase 6 implemented the real pricebook item modal calculation flow inside the existing cost-report wizard. This focused repair fixes the frontend state path that blocked the backend-tested sequence: preserve singleton edition responses with `active_price_set`, create the financial document from `selectedEdition.active_price_set.id`, store the returned document, browse the pricebook, calculate an item, add a line, then recalculate and refresh the current document panel.

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
- Did not implement Phase 7.
- Did not implement full Phase 8.
- Did not add coefficient selection UI.
- Did not change Docker files or deployment configuration.

## Files Created

- `code_oder/v0.0/phaze6/REPORT.md`
- `code_oder/v0.0/phaze6/TEST_RESULTS.md`

## Files Modified

- `src/pages/CostReportWizardPage.tsx`
- `src/features/pricebooks/pricebookApi.ts`
- `src/shared/utils/formatters.ts`
- `code_oder/v0.0/phaze6/REPORT.md`
- `code_oder/v0.0/phaze6/TEST_RESULTS.md`

Existing Phase 6-related files from earlier work include:

- `src/features/pricebooks/pricebookApi.ts`
- `src/features/financialDocuments/financialDocumentApi.ts`
- `src/shared/api/generated/schema.ts`
- `src/shared/components/GuidedTour.tsx`
- `src/vite-env.d.ts`
- `.env.example`

## Implementation Details

- Confirmed existing RTK Query hooks already use the documented backend endpoints for:
  - project creation;
  - financial document creation;
  - item calculation;
  - financial document line creation;
  - financial document recalculation.
- Diagnosed the remaining frontend blocker before patching:
  - `selectedPricebookId` stores only the selected pricebook id, then resolves the full pricebook object from API data.
  - `selectedEditionId` stores only the selected edition id, then resolves the full edition object from API data.
  - `active_price_set` was preserved for array and paginated edition responses, but was lost when the backend returned a single edition object.
  - That normalization gap could make `selectedEdition` empty and trigger a false no-active-price-set message even though the backend returned `active_price_set.id`.
  - Project/document creation, document storage, modal propagation, and line payloads were otherwise using the documented APIs.
- Updated `listPricebookEditions` in `pricebookApi.ts` to normalize its response to `PricebookEdition[]` while preserving the full edition object, including `active_price_set`.
- The `listPricebookEditions` normalizer handles all observed response shapes:
  - paginated objects with `results`;
  - plain arrays;
  - singleton objects returned by nested list actions.
- Kept the wizard list normalizer robust to the same shapes for other nested list actions.
- Updated the wizard submit handler so `createProject(...).unwrap()` is immediately followed by `createDocument(...).unwrap()`.
- Financial document creation now uses the selected edition's active price set internally:

```ts
price_set_id: selectedEdition.active_price_set.id
```

- The document creation payload matches the backend-tested contract:
  - `document_type: "cost_report"`;
  - `title`;
  - `report_title`;
  - optional `document_number`;
  - optional date/period fields;
  - `pricebook_edition_id: selectedEdition.id`;
  - `price_set_id: selectedEdition.active_price_set.id` in the normal flow.
- The wizard now treats financial document creation as required before entering the pricebook browser.
- The submit handler no longer swallows `createDocument` failures or navigates into the browser with `createdDocument = null`.
- If document creation fails, the wizard stays on the setup form and displays the backend validation/error message through the existing Persian-friendly API error handling.
- If the selected edition has no active price set, the wizard stays on setup and shows the no-active-price-set message instead of entering a broken browser state.
- The item modal receives the stored document object from wizard state.
- After a successful backend calculation, `افزودن به صورت‌بها` is enabled only when:
  - a calculation exists;
  - a real financial document id exists;
  - the item is not a blocked manual/starred-price row.
- The add-line action calls the documented payload:

```ts
{
  pricebook_item_id: item.id,
  quantity: calculation.quantity
}
```

- After line creation, the wizard calls document recalculation and stores the returned document so the current `صورت‌بها` panel can show refreshed lines/totals.
- Added shared display-only `formatMoneyAmount` in `src/shared/utils/formatters.ts`.
- `formatMoneyAmount` accepts string, number, null, and undefined values.
- Null, undefined, and empty values display as `—`.
- Valid numeric amount strings display with comma grouping and no decimal part, for example `1774000.0000000000` displays as `1,774,000`.
- The formatter is used for item official/unit price displays, calculation result amount cards, applied coefficient effect summaries, current cost-report line totals, and document totals.
- Backend Decimal/string values remain unchanged internally and in request payloads.
- Quantities are not formatted with this helper.
- The disabled add-line helper is now state-specific:
  - before calculation, it tells the user to calculate first;
  - for manual/starred rows, it states those rows cannot be added in this version;
  - missing document context is treated as a real fallback error, not normal flow copy.
- Existing Phase 6 calculation behavior remains intact:
  - quantity input normalizes Persian/Arabic digits before submission;
  - backend calculation results are displayed as strings;
  - missing official prices are never treated as zero;
  - manual/starred-price rows remain blocked until backend support exists.

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
- The frontend depends on `PricebookEdition.active_price_set` from the backend schema.
- `POST /api/pricebook-items/{id}/calculate/` does not accept `price_set_id`; the frontend does not send it there.
- `POST /api/projects/{id}/financial-documents/` requires `price_set_id`; the frontend derives it from `selectedEdition.active_price_set.id`.

## Docker / Online Dev Deployment Notes

Docker files were not changed in Phase 6.

Docker build was not required because `docker/`, `.dockerignore`, and compose files were unchanged.

## Issues and Findings

- The latest proven blocker was edition response normalization: `listPricebookEditions` was typed as paginated while the local backend returned a singleton edition object, so the wizard could derive an empty edition list and lose `active_price_set`.
- The previous blocking behavior came from the frontend entering the browser even when document creation failed, leaving `createdDocument = null`.
- Target backend deployments must include the active-price-set edition response for the normal full create-document/add-line flow.
- Manual/starred-price calculation remains intentionally blocked until backend support exists.
- No frontend test runner or test script is configured in `package.json`.
- Manual browser verification was not run in this environment.

## Risks and Assumptions

- Assumed `backend_docs/v0.0/ratab v0.0 Backend API.yaml` is the authoritative contract.
- Assumed ABN1404 / 1404 has an active price set in the target backend data.
- Assumed the local backend-tested flow and payloads match the target v0.0 backend behavior.
- Assumed coefficient selection belongs to a later frontend phase.
- Assumed full Phase 8 document editing remains future work; this fix only wires the minimal documented line-add bridge after calculation.

## User Actions Required

- Run the frontend against the local backend that returns `active_price_set.id = 2` for ABN1404 / 1404.
- Manually open the cost-report wizard in a browser and verify ABN1404 / 1404 is selected.
- Confirm the normal flow creates a draft financial document before the browser opens.
- Calculate at least one priced item and confirm totals match the backend response.
- Click `افزودن به صورت‌بها` and confirm the line appears in the current cost-report list.
- Confirm the backend database shows the expected document and line counts after the browser test.
- Test a missing/manual-price item and confirm calculation/add-to-document stay blocked without submitting zero.

## Suggested Commit Message

fix(frontend-phase6): format financial amount displays

## Next Step

After browser review, proceed only with the next approved frontend phase.
