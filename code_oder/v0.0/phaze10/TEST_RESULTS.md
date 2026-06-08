# Frontend Phase 10 Second Corrective Follow-up Test Results

## Commands Run

```bash
npm run build
```

```bash
npm run lint
```

## Results

- `npm run build`: passed.
- `npm run lint`: passed.
- Both commands ran the existing `generate:api` script and regenerated `src/shared/api/generated/schema.ts` from `backend_docs/v0.0/ratab v0.0 Backend API.yaml`.
- Build produced the existing non-blocking Vite warning that one JavaScript chunk is larger than 500 kB.

## Failed Tests

Not applicable.

## Tests Not Run

- `npm test` was not run because `package.json` does not define a `test` script.
- Browser/manual responsive checks were not run in this environment.
- Docker build was not run because Docker files were not changed in this corrective pass.

## Manual Smoke Checklist

- Verify logged-out `/` still shows the Metril landing page.
- Verify logged-in `/` still enters `/companies`.
- Verify the main sidebar no longer shows health/status and includes the requested account/company actions.
- Verify the company dashboard messages section still works as local-only messaging.
- Verify the `صورت‌بهاها` section lists saved backend financial documents and does not directly open creation.
- Verify the `صورت‌بهای جدید` CTA opens the builder.
- Verify the cost-report builder compact stepper clearly shows active/completed/inactive state.
- Verify the browser step opens without excessive header height.
- Verify chapter and item lists scroll inside fixed-height containers.
- Verify long item titles are clamped to two lines.
- Verify coefficient management opens from the compact top-left drawer button and closes on Escape/outside click.
- Verify item modal calculation, optional footnote selection, edit/send flow, manual-price blocking, and line add/recalculate.
- Verify line edit/delete icon buttons are tappable on mobile.
- Verify HTML preview uses the injected B Nazanin styling and centered table cells.
- Verify PDF download shows backend-provided ready file only if available, and otherwise shows unavailable-PDF messaging.
- Verify Help includes guidance for cost-report list, HTML preview, PDF download, footnotes, coefficients, and trial limitations.
- Verify light mode on desktop and mobile.

## Notes

- No backend files or commands were touched.
- Persistent company messages still require backend endpoints.
- Footnote-aware calculation still requires backend calculate payload support.
- Real PDF download still requires backend PDF rendering and stored file support.
- Account update/delete still requires backend account APIs.
