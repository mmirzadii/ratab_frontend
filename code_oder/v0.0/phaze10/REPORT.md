# Frontend Phase 10 Report

## Summary

Status: done.

This focused Phase 10 follow-up restructured the cost report builder into a clearer five-section workflow: project information, cost report information, pricebook browsing, coefficients, and final review. The existing backend-backed project/document creation, item calculation, line creation, recalculation, HTML preview, backend export, and browser PDF demo behavior remain intact.

## Scope

- Implemented only frontend Phase 10 cost-report builder restructuring.
- Did not touch backend code.
- Did not invent endpoints.
- Did not hardcode backend URLs, database ids, or `price_set_id`.
- Did not change financial calculations or treat missing prices as zero.
- Preserved the existing add-to-cost-report and browser PDF demo flows.

## Files Created

Not applicable.

## Files Modified

- `src/pages/CostReportWizardPage.tsx`
- `code_oder/v0.0/phaze10/REPORT.md`
- `code_oder/v0.0/phaze10/TEST_RESULTS.md`

## Implementation Details

- Added a dedicated builder section model and navigator for:
  - `اطلاعات پروژه`
  - `اطلاعات صورت‌بها`
  - `مرور فهرست‌بها`
  - `ضرایب`
  - `نهایی کردن صورت‌بها`
- Split the old two-step setup/browser flow so project details and document details are separate user-facing screens.
- Locked sections 3, 4, and 5 until a real draft financial document exists.
- Kept document creation on the documented backend flow and still uses `selectedEdition.active_price_set.id` for `price_set_id`.
- Reused existing draft project/document state when returning between sections to avoid duplicate backend records.
- Moved the full document line/totals/preview/export panel into the final review section.
- Added a compact current cost-report summary inside the pricebook browser section.
- Moved coefficient management into its own section and kept the selected coefficient set available for item calculation.
- Added a final-review action that clearly saves/acknowledges the draft state without pretending to call an unavailable official finalization endpoint.

## UI/UX Notes

- The builder now has a left-side section navigator on desktop and compact horizontal navigation on smaller screens.
- Later sections show as disabled until project/document setup is complete.
- The pricebook browser is less cluttered while users choose items.
- Final review is the place for line list, totals, preview, export, browser PDF, and send/attach actions.
- Normal UI does not expose raw `price_set_id` or require `VITE_DEFAULT_PRICE_SET_ID`.

## API Contract Notes

- No API contract changes were made.
- Existing documented endpoints remain in use:
  - project creation;
  - financial document creation;
  - item calculation;
  - financial document line creation;
  - document recalculation;
  - preview/export endpoints already present in the page.
- Official finalization/locking is not faked because no product-approved frontend endpoint was introduced for that in this task.

## Issues and Findings

- The previous implementation was effectively a two-state `setup | browser` page, so coefficients and final review were not first-class workflow steps.
- Official final submission remains a backend/product gap for this frontend phase; the UI now labels the action as draft-state acknowledgement.
- `npm run build` still emits the existing non-blocking Vite chunk-size warning.
- No `npm test` script exists in `package.json`.

### Starred/Manual-Price Limitation (v0.0)

- `PricebookCalculateInputRequest` (v0.0) has only `quantity` and `coefficient_set_id`; **no `manual_unit_price` field**.
- `FinancialDocumentLineCreateRequest` (v0.0) has only `pricebook_item_id` and `quantity`; **no `manual_unit_price` field**.
- Frontend detects starred items via `hasManualUnitPrice(item)` (checks `row.requires_manual_unit_price` and null/blank `unit_price`).
- The UI shows a `قیمت واحد پیشنهادی` input where users can record a proposed price; this is validated (required, positive decimal) but **not sent to the backend** because the v0.0 API contract does not accept it.
- Attempting to calculate or add a starred item shows a clear Persian message explaining the v0.0 limitation; the backend error shape `ManualPriceValidationError` / `ManualPriceLineValidationError` is handled by `getManualPriceValidationMessage`.
- Missing prices are never treated as zero anywhere in the frontend.

## Risks and Assumptions

- Assumed the existing backend-tested create project -> create document -> calculate item -> add line -> recalculate flow remains the source of truth.
- Assumed final official locking/submission belongs to a later backend/API decision.
- Assumed keeping the hidden development fallback code out of the normal flow is acceptable while normal flow uses `active_price_set`.

## User Actions Required

- Manually test the cost report builder from the company dashboard plus/attachment entry point.
- Confirm sections 3, 4, and 5 stay disabled until the draft document is created.
- Confirm project info -> cost report info creates the draft document and opens the pricebook browser.
- Add a calculated item to the cost report, then verify it appears in the final review section.
- Review the coefficient section with an active project and confirm coefficient selection still affects calculation.
- Confirm final review preview/export/browser PDF actions still work as before.

## Suggested Commit Message

fix(frontend-phase10): restructure cost report builder workflow

## Refactor and Maintainability Notes (Phase 10 Continuation)

A subsequent code-quality pass split `src/pages/CostReportWizardPage.tsx` from 3,595 lines into a thin orchestrator (~480 lines) by extracting all types, constants, utilities, and sub-components into the `src/features/costReports/` feature directory. No behavior changes were made.

## Files Split (Refactor Pass)

| New file | Extracted from |
|---|---|
| `src/features/costReports/types.ts` | `CostReportWizardPage.tsx` |
| `src/features/costReports/constants.ts` | `CostReportWizardPage.tsx` |
| `src/features/costReports/costReportUtils.ts` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/BuilderSectionNav.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ItemNotesSections.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/CalculationSection.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ItemDetailModal.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/CurrentDocumentPanel.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ProjectCoefficientPanel.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ProjectInfoSection.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/DocumentInfoSection.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/PricebookBrowserSection.tsx` | `CostReportWizardPage.tsx` |
| `src/shared/utils/apiError.ts` | `CostReportWizardPage.tsx` + `CompanyDashboardPage.tsx` |
| `src/shared/utils/listResults.ts` | `CostReportWizardPage.tsx` + `CompanyDashboardPage.tsx` |
| `src/shared/components/Field.tsx` | `CostReportWizardPage.tsx` |
| `src/shared/components/InfoBox.tsx` | `CostReportWizardPage.tsx` |

Updated files:
- `src/shared/utils/classNames.ts` — added shared `linkButtonClasses` constant
- `src/pages/CostReportWizardPage.tsx` — rewritten as thin orchestrator
- `src/pages/CompanyDashboardPage.tsx` — replaced local duplicate utilities with shared imports

## Behavior Preservation Notes

- All event handlers, state shape, and RTK Query hook calls remain in `CostReportWizardPage.tsx`.
- PDF builder functions (`buildPreviewSrcDoc`, `buildBrowserPdfPrintDoc`) remain inside `CurrentDocumentPanel.tsx` because they require the `B-NAZANIN.TTF?url` Vite asset import.
- The `getApiErrorMessage` fallback message wording may differ slightly for network-error fallbacks in `CompanyDashboardPage.tsx`; the function signature accepts an optional second `fallback` parameter for callers that need a specific message.
- Dead code removed: a `className="hidden"` div containing the old two-step stepper UI (had no observable behavior).

## Next Step

After manual browser review, proceed only with the next approved frontend phase.
