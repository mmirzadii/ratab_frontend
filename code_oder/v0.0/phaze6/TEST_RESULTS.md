# Frontend Phase 6 Test Results

## Commands Run

Inspection:

```powershell
rg -n "createProject|createDocument|createProjectFinancialDocument|setCreatedDocument|setStep\(|selectedActivePriceSet|priceSetId|VITE_DEFAULT_PRICE_SET_ID|documentSetupNotice|برای افزودن خط|canAddLine|createFinancialDocumentLine|recalculateFinancialDocument" src/pages/CostReportWizardPage.tsx
```

```powershell
Get-Content -Raw src/features/financialDocuments/financialDocumentApi.ts
```

```powershell
Get-Content -Raw src/features/projects/projectApi.ts
```

```powershell
Get-Content -Raw src/features/pricebooks/pricebookApi.ts
```

```powershell
rg -n "FinancialDocumentCreateRequest|FinancialDocumentLineCreateRequest|ActivePriceSet|PricebookEdition" src/shared/api/generated/schema.ts
```

```powershell
rg -n "ActivePriceSet|PricebookEdition|FinancialDocumentCreateRequest|FinancialDocumentLineCreateRequest|PricebookCalculateInputRequest|PricebookCalculateResponse|/api/pricebooks/\{id\}/editions/|/api/projects/\{id\}/financial-documents/|/api/financial-documents/\{id\}/lines/" "backend_docs/v0.0/ratab v0.0 Backend API.yaml"
```

```powershell
rg -n "formatPrice|formatMoneyAmount|base_amount|coefficient_amount|total_amount|effect_amount|total_amount_snapshot|unit_price" src/pages/CostReportWizardPage.tsx src/shared/utils/formatters.ts
```

Verification:

```powershell
npm run build
```

```powershell
npm run lint
```

## Results

- Inspection confirmed the financial document API hooks already use documented endpoints.
- Inspection confirmed `FinancialDocumentCreateRequest` requires `pricebook_edition_id` and `price_set_id`.
- Inspection confirmed `FinancialDocumentLineCreateRequest` is `pricebook_item_id` plus `quantity`.
- Inspection confirmed `PricebookEdition` includes `active_price_set`.
- Inspection found `listPricebookEditions` was typed as paginated while local backend behavior returns a singleton edition object.
- `listPricebookEditions` now normalizes paginated, array, and singleton responses to `PricebookEdition[]`, preserving `active_price_set`.
- The wizard normalizer also remains robust for other nested response shapes.
- `formatMoneyAmount` was added and applied to financial amount displays without changing backend payload values or quantity strings.
- `npm run build`: passed.
  - OpenAPI types regenerated.
  - TypeScript build passed.
  - Vite production build passed.
- `npm run lint`: passed.
  - OpenAPI types regenerated.
  - ESLint completed without reported errors.

## Failed Tests

Not applicable.

## Tests Not Run

- `npm test` was not run because `package.json` does not define a `test` script.
- Docker build was not run because Phase 6 did not add or modify Docker files.
- Manual browser inspection was not run in this environment.

## Notes

- Build and lint validate the TypeScript and static code path only.
- Manual browser checks are still required for:
  - ABN1404 / 1404 draft document creation from `active_price_set`;
  - staying on the setup form when document creation fails;
  - priced-item calculation;
  - `افزودن به صورت‌بها`;
  - current cost-report line list refresh;
  - missing/manual-price blocking.
