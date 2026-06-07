# Frontend Phase 7 Report

## Summary

Status: done.

Frontend Phase 7 added project coefficient management to the cost report workspace and connected selected coefficient sets to backend item calculation. Users can create/select coefficient sets, add coefficient values, choose supported coefficient keys/scopes, calculate items with a selected coefficient set, see backend-returned applied coefficients, and keep the existing add-to-صورت‌بها line flow.

## Scope

- Implemented only Frontend Phase 7.
- Used the documented backend contract from:

```text
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```

- Added frontend usage of the documented coefficient endpoints:

```text
GET /api/projects/{id}/coefficient-sets/
POST /api/projects/{id}/coefficient-sets/
GET /api/coefficient-sets/{id}/values/
POST /api/coefficient-sets/{id}/values/
PATCH /api/coefficient-values/{id}/
DELETE /api/coefficient-values/{id}/
POST /api/pricebook-items/{id}/calculate/
```

- Did not create backend code.
- Did not invent endpoints.
- Did not implement coefficient snapshots on document line creation because the documented line-create payload does not include coefficient fields.
- Did not change Docker/deployment files.

## Files Created

- `src/features/coefficients/coefficientApi.ts`
- `code_oder/v0.0/phaze7/REPORT.md`
- `code_oder/v0.0/phaze7/TEST_RESULTS.md`

## Files Modified

- `src/shared/api/baseApi.ts`
- `src/pages/CostReportWizardPage.tsx`

## Implementation Details

- Added an RTK Query coefficient API slice for coefficient set list/create, coefficient value list/create/update/delete, and cache tags.
- Added `Coefficient` to shared RTK Query tag types.
- Added supported coefficient keys:
  - `regional`
  - `overhead`
  - `floor`
  - `proposal`
  - `custom_1`
  - `custom_2`
- Added supported coefficient scopes:
  - `project`
  - `chapter`
  - `row`
- Added positive decimal validation for coefficient multipliers.
- Normalized Persian/Arabic digit input before submitting multiplier and numeric scope IDs.
- Added a project coefficient panel inside the cost report browser step after the draft project/document exists.
- Added coefficient set selection in the item detail modal.
- Updated item calculation to send `coefficient_set_id` only when a coefficient set is selected; otherwise the payload omits it.
- Preserved backend-calculated display for base amount, coefficient amount, total amount, and applied coefficients.
- Preserved the existing add-to-صورت‌بها flow after calculation.

## UI/UX Notes

- UI remains Persian-first, RTL, and aligned with the existing dark glassmorphism style.
- Coefficient management is presented as a project workflow panel, not a raw admin table.
- Empty, loading, and error states were added for coefficient sets and values.
- The item modal explains that users must first create a coefficient set if none exists.
- Manual/starred-price rows remain blocked from calculation/addition and are never treated as zero.

## API Contract Notes

- The implementation uses only documented OpenAPI paths and request payloads.
- Coefficient values use backend-supported fields: `coefficient_key`, `scope`, `chapter_id`, `row_id`, `label_fa`, `multiplier`, and `is_active`.
- Calculation uses the documented optional `coefficient_set_id`.
- Financial document line creation remains unchanged because the documented payload only accepts `pricebook_item_id` and `quantity`.

## Issues and Findings

- Row-scoped coefficient creation requires a backend row ID. The current OpenAPI item detail exposes row IDs, so the UI accepts that numeric row ID for row scope.
- The backend line-create endpoint does not expose coefficient snapshot fields; if coefficient-aware persisted lines are required later, backend/API support is needed.
- No frontend test runner or `npm test` script is configured in `package.json`.
- Manual browser verification was not run in this environment.

## Risks and Assumptions

- Assumed the latest generated OpenAPI schema is authoritative.
- Assumed the backend applies selected coefficient sets during item calculation and returns applied coefficient details.
- Assumed coefficient set/value APIs enforce project/company access isolation server-side.
- Assumed coefficient selection during calculation is sufficient for Phase 7; persisted document-line coefficient snapshots remain future backend/API work.

## User Actions Required

- Set `.env.local` to `VITE_API_BASE_URL=http://localhost:8000` for local verification.
- In the browser, create a project/cost report, create a coefficient set, add coefficient values, calculate an item with the selected set, and verify applied coefficients appear.
- Add the calculated item to the current صورت‌بها and confirm the existing line panel still updates.
- For row-scoped coefficients, copy the numeric row ID from item detail until a friendlier row picker is implemented.

## Suggested Commit Message

feat(frontend-phase7): add project coefficients UI and calculation integration

## Next Step

After local browser verification, proceed only with the next approved frontend phase.
