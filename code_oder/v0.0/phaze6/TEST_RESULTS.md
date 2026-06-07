# Frontend Phase 6 Test Results

## Commands Run

Backend active-price-set follow-up:

```powershell
Copy-Item -LiteralPath D:\work\ratab\ratab_backend\docs\openapi_v0_0.yaml -Destination "backend_docs/v0.0/ratab v0.0 Backend API.yaml" -Force
```

```powershell
Copy-Item -LiteralPath D:\work\ratab\ratab_backend\docs\openapi_v0_0.yaml -Destination "backend_docs/v0.0/openapi_v0_0.yaml" -Force
```

```powershell
Copy-Item -LiteralPath D:\work\ratab\ratab_backend\docs\frontend_handoff_v0_0.md -Destination "backend_docs/v0.0/frontend_handoff_v0_0.md" -Force
```

```powershell
npm run generate:api
```

```powershell
npm run build
```

```powershell
npm run lint
```

Inspection:

```powershell
rg -n "active_price_set|VITE_DEFAULT_PRICE_SET_ID|price_set_id|deprecated|advanced|مجموعه قیمت|تنظیمات پیشرفته" src/pages/CostReportWizardPage.tsx src/shared/components/GuidedTour.tsx .env.example src/vite-env.d.ts src/shared/api/generated/schema.ts
```

```powershell
git diff --name-only
```

```powershell
git diff --check
```

## Results

- Backend docs/OpenAPI were synced into the frontend `backend_docs/v0.0/` folder.
- `npm run generate:api`: passed.
  - Generated schema includes `ActivePriceSet`.
  - Generated `PricebookEdition` includes `active_price_set`.
- `npm run build`: passed.
  - OpenAPI types regenerated.
  - TypeScript build passed.
  - Vite production build passed.
- `npm run lint`: passed.
  - OpenAPI types regenerated.
  - ESLint completed without reported errors.
- Inspection confirmed the normal flow uses `selectedEdition.active_price_set.id`.
- Inspection confirmed `VITE_DEFAULT_PRICE_SET_ID` remains only as a deprecated hidden fallback.
- `git diff --check`: passed with only Git CRLF normalization warnings.

## Failed Tests

Not applicable.

## Tests Not Run

- `npm test` was not run because `package.json` does not define a `test` script.
- Docker build was not run because Phase 6 did not add or modify Docker files.
- Manual browser inspection was not run in this environment.

## Notes

- Build and lint validate the TypeScript and static code path only.
- Manual browser checks are still required for:
  - normal ABN1404 / 1404 draft document creation from `active_price_set`;
  - priced-item calculation;
  - `افزودن به صورت‌بها`;
  - current cost-report line list refresh;
  - no-active-price-set browsing behavior;
  - missing/manual-price blocking.
