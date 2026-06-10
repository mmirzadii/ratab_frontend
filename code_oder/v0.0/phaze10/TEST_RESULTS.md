# Frontend Phase 10 Test Results

## Commands Run

```bash
npm run build
```

```bash
npm run lint
```

```bash
node -e "const p=require('./package.json'); console.log(p.scripts && p.scripts.test ? p.scripts.test : 'NO_TEST_SCRIPT')"
```

## Results

- `npm run build`: passed.
- `npm run lint`: passed.
- Both build and lint ran the existing `generate:api` script and regenerated `src/shared/api/generated/schema.ts` from `backend_docs/v0.0/ratab v0.0 Backend API.yaml`.
- `node ... package.json`: returned `NO_TEST_SCRIPT`.
- Build produced the existing non-blocking Vite warning that one JavaScript chunk is larger than 500 kB.

## Failed Tests

Not applicable.

## Tests Not Run

- `npm test` was not run because `package.json` does not define a `test` script.
- Manual browser verification was not run in this environment.
- Docker build was not run because Docker files were not changed.

## Manual Smoke Checklist

- Open the company dashboard and start a new cost report from the plus/attachment flow.
- Confirm the builder shows five sections.
- Confirm sections 3, 4, and 5 are disabled before draft document creation.
- Complete project information, continue to cost report information, and create the draft document.
- Confirm the pricebook browser opens only after document creation succeeds.
- Calculate an item and add it to the cost report.
- Open final review and confirm the line list, totals, preview/export actions, and browser PDF action are still available.
- Open the coefficients section and confirm coefficient set selection remains available for item calculation.

## Refactor Pass — Commands Run

```
npm run build
```

```
npm run lint
```

## Refactor Pass — Results

- `npm run build`: passed. All 1664 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.
- `npm run lint`: passed after fixing six unused-import errors introduced during extraction (unused `Calculator`, `StatusBadge`, `classNames` in `ItemDetailModal.tsx`; unused `chapters` prop in `PricebookBrowserSection.tsx`; unused `SlidersHorizontal` in `ProjectCoefficientPanel.tsx`; unused `Loader2` in `CostReportWizardPage.tsx`).

## Starred/Manual-Price Support Pass — Commands Run

```
npm run build
```

```
npm run lint
```

## Starred/Manual-Price Support Pass — Results

- `npm run build`: passed. 1670 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.
- `npm run lint`: passed with no errors.

## Starred/Manual-Price Support Pass — Changes

- `src/features/costReports/components/CalculationSection.tsx`: enabled `قیمت واحد پیشنهادی` input (was disabled), wired up `manualUnitPrice`/`onManualUnitPriceChange`/`manualUnitPriceError` props, removed `requiresManualPrice` from calculate button disabled condition, updated amber-box limitation text to reference v0.0 explicitly.
- `src/features/costReports/components/ItemDetailModal.tsx`: added `manualUnitPrice` and `manualUnitPriceError` state, validate manual price (required + positive decimal) before calculate, show clear v0.0 limitation message when validation passes (price cannot be sent to backend), updated `addLineDisabledReason` and `handleAddLine` guard messages for starred items.

## Starred/Manual-Price — Limitation Note (v0.0)

Backend v0.0 `PricebookCalculateInputRequest` and `FinancialDocumentLineCreateRequest` do not include a `manual_unit_price` field. Therefore:
- Frontend validates and records the proposed price but does **not** send it to the backend.
- Calculation and line-add for starred items remain blocked with a clear Persian message.
- `ManualPriceValidationError` / `ManualPriceLineValidationError` shapes from the backend are handled via `getManualPriceValidationMessage`.
- Missing prices are never treated as zero.

## Notes

- No backend files or endpoints were changed.
- No frontend routes were added.
- No production deployment or Docker files were changed.
- No behavior changes in the refactor pass. All logic was moved, not rewritten.
