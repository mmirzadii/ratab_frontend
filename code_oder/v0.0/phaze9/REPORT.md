# Frontend Phase 9 Report

## Summary

Status: done.

Frontend Phase 9 added a public Ratab landing page at `/`, kept `/login` as the public login route, preserved authenticated app routes behind `RequireAuth`, and added document HTML preview plus export metadata/download handling to the current cost-report panel. The UI now presents PDF generation as unavailable in v0.0 instead of faking a successful PDF download.

## Scope

- Implemented only Frontend Phase 9.
- Used the documented backend API contract from:

```text
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
```

- Added frontend usage of documented preview/export endpoints:

```text
GET /api/financial-documents/{id}/preview/
POST /api/financial-documents/{id}/exports/
GET /api/financial-document-exports/{id}/download/
```

- Did not create backend code.
- Did not invent endpoints.
- Did not hardcode backend URLs or ids in source code.
- Did not change Docker files.
- Did not fake PDF generation.

## Files Created

- `src/pages/LandingPage.tsx`
- `docs/product_reference/v0.0/landing_reference.html`
- `code_oder/v0.0/phaze9/REPORT.md`
- `code_oder/v0.0/phaze9/TEST_RESULTS.md`

## Files Modified

- `src/app/router.tsx`
- `src/pages/LoginPage.tsx`
- `src/features/financialDocuments/financialDocumentApi.ts`
- `src/pages/CostReportWizardPage.tsx`

## Implementation Details

- Added a public `/` landing route.
- Moved authenticated app entry to protected routes such as `/companies`, `/companies/:companyId`, `/companies/:companyId/cost-reports/new`, and `/dashboard`.
- Updated login success/default redirect to enter `/companies` instead of returning to the public landing page.
- Added a polished Persian RTL landing page with:
  - Ratab branding;
  - hero message;
  - CTA buttons to `/login` or `/companies` depending on auth state;
  - dashboard-style visual preview;
  - feature cards;
  - workflow section;
  - dev/demo notice.
- Documented the provided HTML reference under `docs/product_reference/v0.0/landing_reference.html` and did not copy unsafe scripts into React.
- Added RTK Query endpoints for:
  - HTML preview as `text/html`;
  - export metadata creation;
  - export download.
- Rendered backend HTML preview in a sandboxed iframe via `srcDoc`.
- Added user-facing preview/export actions to the current cost-report panel.
- Added PDF-unavailable handling for failed/not-ready exports and `409 Conflict` download responses.

## Landing Page Notes

- `/` is public and no longer redirects every visitor to login or the authenticated company flow.
- Authenticated users still see a clear CTA to enter the workspace.
- Unauthenticated users see CTA buttons that route to `/login`.
- The landing design follows the provided dark/glassmorphism reference while replacing unrelated placeholder branding with Ratab.
- No CDN Tailwind, Alpine.js, Three.js, GSAP, or unsafe inline scripts were added.

## UI/UX Notes

- Protected company/project/document data remains behind auth.
- `/login` remains public.
- `/status` remains available.
- Item list internal scrolling from Phase 8 was preserved.
- Coefficient UI remains compact.
- Financial amount display continues to use no decimals and comma grouping.
- Manual/starred price rows remain blocked and are not treated as zero.
- Normal UI does not expose raw `price_set_id`.

## API Contract Notes

- `VITE_API_BASE_URL` remains the only source-code API base configuration.
- `POST /api/auth/dev-login/` remains POST.
- Auth headers are still attached as `Authorization: Token <token>`.
- Preview uses `GET /api/financial-documents/{id}/preview/`.
- Export metadata uses `POST /api/financial-documents/{id}/exports/`.
- Download uses `GET /api/financial-document-exports/{id}/download/` only through the documented endpoint and handles `409` as a blocked PDF state.

## Preview and Export Notes

- HTML preview is shown in a sandboxed iframe.
- Export creation shows backend metadata status.
- If export status is not `ready` or no file is present, the UI explains that PDF output is not active in the demo version.
- The UI does not show a broken download link.
- If a future backend returns a ready file, the download action creates a browser download from the returned blob.

## Dev Deployment Notes

Local dev should use:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Online dev builds should use:

```env
VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

Docker build command:

```powershell
docker build `
  --build-arg VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir `
  -t registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main `
  -f docker/frontend/Dockerfile .
```

Docker push command:

```powershell
docker push registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main
```

Hamravesh frontend app settings:

```text
App name: ratab-frontend-dev
Image: registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main
Port: 80
Command: empty
Args: empty
Readiness Probe: /
```

Backend CORS requirements after public frontend URL is assigned:

```env
CORS_ALLOWED_ORIGINS=https://metril.darkube.ir,http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=https://metril.darkube.ir,http://localhost:5173,http://127.0.0.1:5173
```

The frontend must be rebuilt after changing `VITE_API_BASE_URL` because Vite injects it at build time.

## Issues and Findings

- Manual browser smoke testing was not run in this environment.
- No `npm test` script is configured in `package.json`.
- `npm run build` reports the existing Vite large chunk warning after a successful build.
- PDF binary generation remains backend-blocked in v0.0; the frontend displays this as a limitation.

## Risks and Assumptions

- Assumed the local/backend dev deployments expose the documented preview and export endpoints.
- Assumed export download will usually return `409` in v0.0 until a PDF renderer is approved.
- Assumed the existing authenticated cost-report flow from Phases 6-8 remains the target smoke path.
- Assumed browser verification will be completed manually against `http://localhost:5173` and `http://localhost:8000`.

## User Actions Required

- Run the frontend locally with `.env.local` set to `VITE_API_BASE_URL=http://localhost:8000`.
- Manually verify `/` renders the public landing page for a logged-out visitor.
- Manually verify `/login` still works and successful login enters `/companies`.
- Manually verify protected routes redirect logged-out users to `/login`.
- Complete the local smoke path: landing, login, company, cost report, ABN1404/1404, item calculation, add line, recalculate totals, preview HTML, and export action.
- Confirm PDF export shows the v0.0 unavailable message instead of a broken download.
- Before online demo testing, rebuild the frontend image with the online dev backend URL and update backend CORS for `https://metril.darkube.ir`.

## Suggested Commit Message

test(frontend-phase9): verify demo flow and landing preview export

## Next Step

After browser smoke testing and online-dev rebuild, proceed only with the next approved frontend phase.
