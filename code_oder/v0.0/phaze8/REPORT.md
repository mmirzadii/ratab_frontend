# Frontend Phase 8 Report

## Summary

Status: done.

Frontend Phase 8 improved the active financial document workflow inside the cost report wizard. The current صورت‌بها panel now shows document metadata, backend status, backend totals, line snapshots, chapter totals, recalculate/lock actions, and documented line edit/delete actions. The pricebook item list now scrolls inside its own panel, and the Phase 7 coefficient section is compact by default.

## Scope

- Implemented only Frontend Phase 8.
- Used only documented backend API contracts from:

```text
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
```

- Used documented financial document endpoints:

```text
GET /api/projects/{id}/financial-documents/
POST /api/projects/{id}/financial-documents/
GET /api/financial-documents/{id}/
PATCH /api/financial-documents/{id}/
POST /api/financial-documents/{id}/lines/
POST /api/financial-documents/{id}/recalculate/
POST /api/financial-documents/{id}/lock/
PATCH /api/financial-document-lines/{id}/
DELETE /api/financial-document-lines/{id}/
```

- Did not create backend code.
- Did not invent endpoints.
- Did not implement Phase 9 preview/export.
- Did not change Docker/deployment files.

## Files Created

- `code_oder/v0.0/phaze8/REPORT.md`
- `code_oder/v0.0/phaze8/TEST_RESULTS.md`

## Files Modified

- `src/features/financialDocuments/financialDocumentApi.ts`
- `src/pages/CostReportWizardPage.tsx`

## Implementation Details

- Added RTK Query mutations for:
  - partial financial document update;
  - financial document line quantity update;
  - financial document line delete;
  - financial document lock.
- Expanded the current صورت‌بها panel to show:
  - document title;
  - document number;
  - document status;
  - selected pricebook year;
  - selected coefficient set name;
  - line count;
  - pricebook amount;
  - coefficient amount;
  - total amount;
  - calculated/locked state.
- Added line list columns for:
  - line number;
  - row code;
  - description snapshot;
  - quantity;
  - unit;
  - unit price snapshot;
  - base amount snapshot;
  - coefficient amount snapshot;
  - total amount snapshot.
- Added documented line quantity editing via `PATCH /api/financial-document-lines/{id}/`.
- Added documented line deletion via `DELETE /api/financial-document-lines/{id}/`.
- After line edit/delete, the UI calls document recalculation and stores the returned backend document.
- Added recalculate action via `POST /api/financial-documents/{id}/recalculate/`.
- Added lock action via `POST /api/financial-documents/{id}/lock/`.
- Locked documents disable add/edit/delete/recalculate/lock actions in the UI.
- Added chapter totals display from backend `chapter_totals`.
- Kept manual/starred-price rows blocked; missing official prices are never treated as zero.
- Verified the existing shared `formatMoneyAmount` display formatter is used for financial amount displays and not for payloads or quantities.

## UI/UX Notes

- The current صورت‌بها panel is now the main financial document workspace.
- The coefficient management area is compact/collapsed by default, with the active coefficient set still visible.
- The pricebook item list has its own fixed-height scroll container with themed scrollbar styling.
- Chapter/group filters remain outside the item-list scroll area.
- Users can continue browsing pricebook items after adding or editing lines.
- A small note clarifies that PDF preview/export belongs to the next phase and may be backend-blocked in v0.0.

## API Contract Notes

- No endpoints were invented.
- Line edit only submits documented `quantity`.
- Line create remains `pricebook_item_id` plus `quantity`.
- Financial document totals and line amounts are displayed from backend snapshots only.
- The frontend does not recompute official financial totals.
- The backend remains responsible for company/project/document isolation.

## Issues and Findings

- No test runner or `npm test` script is configured in `package.json`.
- Manual browser verification was not run in this environment.
- The row-scoped coefficient UX still requires the backend row ID from item detail; this remains from Phase 7 and is not changed in Phase 8.

## Risks and Assumptions

- Assumed the generated OpenAPI schema is current and matches the local backend.
- Assumed line update/delete and document lock are available in the target backend where Phase 8 is tested.
- Assumed locked documents reject further edits server-side; the frontend also disables those actions.
- Assumed PDF binary generation remains blocked/unavailable until a later approved phase.

## User Actions Required

- Run the frontend locally with `VITE_API_BASE_URL=http://localhost:8000`.
- In the browser, create a cost report, add multiple priced items, and confirm the current صورت‌بها panel updates.
- Test line quantity edit and line delete against the local backend.
- Click محاسبه مجدد and confirm totals/lines refresh from backend.
- Lock a draft document and confirm add/edit/delete actions become disabled.
- Check the item list scroll behavior on desktop/laptop and mobile widths.

## Suggested Commit Message

feat(frontend-phase8): add financial document workflow

## Next Step

After local browser verification, proceed only with the next approved frontend phase.
