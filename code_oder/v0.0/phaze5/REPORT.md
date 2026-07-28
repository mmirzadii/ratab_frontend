# Frontend Phase 5 Report

## Summary

Status: done.

Phase 5 implemented the company-to-cost-report entry flow, project/report context form, and pricebook browser shell. The latest focused follow-up updated the flow to use the backend-provided `active_price_set` from the selected pricebook edition, so ABN1404 / year 1404 can create a draft financial document without a normal-user `price_set_id` workaround.

## Scope

- Implemented only the Phase 5 frontend flow and focused Phase 5/6 bridge fixes.
- Used the required backend API contract from:

```text
backend_docs/history/v0.0/OPENAPI.yaml
```

- Added and used only documented endpoints for companies, projects, financial documents, pricebooks, editions, chapters, groups, and items.
- Did not create backend code.
- Did not invent endpoints.
- Did not change Docker files or deployment configuration.

## Files Created

- `src/features/projects/projectApi.ts`
- `src/features/financialDocuments/financialDocumentApi.ts`
- `src/features/pricebooks/pricebookApi.ts`
- `src/pages/CostReportWizardPage.tsx`
- `backend_docs/history/v0.0/OPENAPI.yaml`
- `code_oder/v0.0/phaze5/REPORT.md`
- `code_oder/v0.0/phaze5/TEST_RESULTS.md`

## Files Modified

- `backend_docs/history/v0.0/frontend_handoff_v0_0.md`
- `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`
- `package.json`
- `src/app/router.tsx`
- `src/shared/api/baseApi.ts`
- `src/shared/api/generated/schema.ts`
- `src/pages/CompanyDashboardPage.tsx`
- `src/shared/components/GuidedTour.tsx`
- `src/vite-env.d.ts`
- `.env.example`

## Implementation Details

- Updated `npm run generate:api` to generate TypeScript types from the required spaced YAML path.
- Synced the frontend OpenAPI/handoff docs with the backend version that includes `PricebookEdition.active_price_set`.
- Regenerated TypeScript API types so `PricebookEdition` includes:

```ts
active_price_set: ActivePriceSet | null
```

- Added RTK Query hooks for documented project, financial document, and pricebook browse endpoints.
- Added the protected wizard route:

```text
/companies/:companyId/cost-reports/new
```

- Moved the cost-report entry point into the company messages surface through a chat-style plus/attachment menu.
- Added the cost-report wizard:
  - Step 1 collects project/report context and creates or reuses the project.
  - Step 2 browses the selected pricebook edition, chapters, groups, and items.
- Defaulted the base year to 1404 and selected ABN1404 / 1404 when available.
- Fixed list response normalization so paginated responses and plain array responses both satisfy the same selection state.
- Fixed the selection-state bug where ABN1404 / 1404 could appear selected visually while validation still treated the selected edition as missing.
- Updated draft financial document creation to use `selectedEdition.active_price_set.id` when available.
- Kept `VITE_DEFAULT_PRICE_SET_ID` only as a deprecated hidden development fallback; it is not the normal path.
- If the selected edition has no active price set, the wizard allows browsing and shows the user-facing setup message: `برای این سال هنوز مجموعه قیمت فعال ثبت نشده است.`
- Normal UI no longer requires or exposes a raw price-set database id.

## UI/UX Notes

- UI remains Persian-first and RTL.
- The wizard follows the existing dark glassmorphism, emerald/teal, violet, and amber visual direction.
- The normal path shows user-friendly pricebook/year labels instead of backend ids.
- The hidden development fallback remains under `تنظیمات پیشرفته توسعه` for temporary internal testing only.
- Pricebook browsing is not blocked when an active price set is missing.
- Missing official prices are never displayed or treated as zero.
- Row codes are preserved as strings.

## API Contract Notes

- `backend_docs/history/v0.0/frontend_handoff_v0_0.md` was synced from the backend docs.
- `backend_docs/history/v0.0/OPENAPI.yaml` was synced from the backend OpenAPI file.
- The schema now exposes `active_price_set` on pricebook edition responses.
- No price-set listing endpoint was invented.
- Financial document creation still uses the documented `price_set_id` field, but the frontend now obtains that id from the selected edition's `active_price_set` object.
- If `active_price_set` is `null`, browsing still works and document creation is skipped with a Persian setup message.

## Docker / Online Dev Deployment Notes

Docker files were not changed in this follow-up.

Docker build was not required because `docker/`, `.dockerignore`, and compose files were unchanged.

## Issues and Findings

- The backend must serve the updated OpenAPI/API behavior in the target environment; older backend deployments without `active_price_set` will still allow browsing but cannot create a normal draft document.
- No frontend test runner or test files are configured yet.
- Browser-level verification was not run in this environment.

## Risks and Assumptions

- Assumed the synced backend OpenAPI file is the authoritative v0.0 contract.
- Assumed ABN1404 / 1404 has one active/default price set in the target backend data.
- Assumed the deprecated `VITE_DEFAULT_PRICE_SET_ID` fallback can remain for hidden internal testing until all dev/demo backends expose `active_price_set`.
- Assumed Phase 6 owns item calculation and line-add behavior after the Phase 5 wizard creates the document context.

## User Actions Required

- Manually test the wizard from `/companies/{companyId}` using the plus button beside the company message input.
- Confirm ABN1404 / 1404 is selected by default when available.
- Confirm continuing to the pricebook browser works without opening advanced development settings.
- Confirm the draft financial document is created from `selectedEdition.active_price_set.id` when the backend returns an active price set.
- Confirm that an edition with no active price set still allows chapter/group/item browsing and shows the Persian setup message.
- Confirm the hidden development fallback is not needed in the normal path.

## Suggested Commit Message

fix(frontend-phase6): use backend active price set for documents

## Next Step

After browser review, continue only with the next approved frontend phase.
