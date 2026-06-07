# Frontend Phase 5 Test Results

## Commands Run

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

Additional inspection commands used during the focused follow-up:

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

- Backend OpenAPI and frontend handoff docs were synced into `backend_docs/v0.0/`.
- `npm run generate:api`: passed and regenerated TypeScript API types from `backend_docs/v0.0/ratab v0.0 Backend API.yaml`.
- Generated schema includes `ActivePriceSet` and `PricebookEdition.active_price_set`.
- `npm run build`: passed.
  - OpenAPI types regenerated.
  - TypeScript build passed.
  - Vite production build passed.
- `npm run lint`: passed.
  - OpenAPI types regenerated.
  - ESLint completed without reported errors.
- Inspection confirmed `VITE_DEFAULT_PRICE_SET_ID` remains only as a deprecated dev fallback, while normal document creation reads `selectedEdition.active_price_set.id`.
- `git diff --check`: passed with only Git CRLF normalization warnings.

## Failed Tests

Not applicable for the latest follow-up.

Historical Phase 5 fixes before this follow-up included one lint cleanup and one TypeScript list-normalizer cleanup; both were fixed before the latest build/lint run.

## Tests Not Run

- `npm test` was not run because `package.json` does not define a `test` script.
- Docker build was not run because Docker files were not changed.
- Browser-level verification was not run in this environment.

## Notes

- Manual browser review is still required for the chat add menu, wizard, default ABN1404 / 1404 selection, and transition into the chapter browser.
- Manual browser review should confirm normal users do not see or enter raw `price_set_id`.
