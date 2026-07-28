# Frontend Phase 1 Report

## Summary

Status: done.

Phase 1 rebuilt the frontend foundation for ratab / رتب with React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, RTK Query, React Router, Persian RTL setup, bundled Vazirmatn font, generated OpenAPI TypeScript types, and a simple health/status screen that calls `GET /api/health/`.

Phase 1 also added production-like online dev Docker support using Vite static output served by nginx.

## Scope

- Scaffolded the React/Vite frontend because no app scaffold existed in the current frontend repo state.
- Configured Tailwind, ESLint, TypeScript, Redux Toolkit, RTK Query, and React Router.
- Added `.env.example` with `VITE_API_BASE_URL`.
- Generated API types from the available OpenAPI schema.
- Added a Persian RTL health/status route at `/`.
- Added Docker static deployment support for Hamravesh/Darkube online dev.
- Did not implement auth, company, pricebook, financial document, or production deployment behavior.

## Files Created

- `.dockerignore`
- `.env.example`
- `.gitignore`
- `docker/frontend/Dockerfile`
- `docker/frontend/nginx.conf`
- `eslint.config.js`
- `index.html`
- `package-lock.json`
- `package.json`
- `postcss.config.js`
- `tailwind.config.ts`
- `tsconfig.app.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `src/vite-env.d.ts`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/hooks.ts`
- `src/app/providers.tsx`
- `src/app/router.tsx`
- `src/app/store.ts`
- `src/features/health/HealthStatusPage.tsx`
- `src/features/health/healthApi.ts`
- `src/features/ui/uiSlice.ts`
- `src/features/ui/usePersistedTheme.ts`
- `src/shared/api/baseApi.ts`
- `src/shared/api/generated/schema.ts`
- `src/shared/components/AppShell.tsx`
- `src/shared/components/GlassCard.tsx`
- `src/styles/index.css`
- `code_oder/v0.0/phaze1/REPORT.md`
- `code_oder/v0.0/phaze1/TEST_RESULTS.md`

## Files Modified

Not applicable.

## Implementation Details

- `npm run generate:api` generates `src/shared/api/generated/schema.ts` from `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`.
- RTK Query base API reads `VITE_API_BASE_URL` from environment configuration.
- The health screen calls only `GET /api/health/`.
- The health response type comes from generated OpenAPI TypeScript types.
- The backend URL is not hardcoded in React components.
- Redux Toolkit currently stores UI theme state only.
- Theme mode is persisted in `localStorage` under `ratab.theme`.
- The app sets `lang="fa"` and `dir="rtl"` at runtime and in `index.html`.
- The visual shell follows the reference direction: dark glassmorphism, right fixed sidebar, sticky header, emerald/teal primary colors, violet and amber status accents, and Persian labels.
- A local Vite dev server was started at `http://127.0.0.1:5173/` with `VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir`.

## UI/UX Notes

- The first screen is an operational status screen, not a marketing landing page.
- The UI is Persian-first and RTL.
- The layout keeps Phase 1 narrow and avoids future company/pricebook flows.
- Vazirmatn is bundled through npm rather than loaded from a CDN.
- Light mode compatibility is included through Tailwind `light:` variants and persisted theme state.

## API Contract Notes

- Used `backend_docs/history/v0.0/frontend_handoff_v0_0.md`.
- Used `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` because the prompt-required filename `backend_docs/history/v0.0/OPENAPI.yaml` was not present.
- `GET /api/health/` is documented in the handoff and OpenAPI schema as public and returns `HealthResponse`.
- No auth, company, pricebook, coefficient, document, preview, or export endpoints were implemented in Phase 1.

## Docker / Online Dev Deployment Notes

- Added `docker/frontend/Dockerfile` with a Node build stage and nginx runtime stage.
- Added `docker/frontend/nginx.conf` with SPA fallback to `index.html`.
- Added `.dockerignore`.
- Docker exposes port `80`.
- `VITE_API_BASE_URL` is passed as a build argument and used during the Vite build.

Required build command:

```powershell
docker build --build-arg VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir -t registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main -f docker/frontend/Dockerfile .
```

Required push command:

```powershell
docker push registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main
```

Required Hamravesh frontend app settings:

```text
App name: ratab-frontend-dev
Image: registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main
Port: 80
```

After the public frontend URL is assigned, update backend CORS manually:

```env
CORS_ALLOWED_ORIGINS=<frontend-darkube-url>,http://localhost:5173
CSRF_TRUSTED_ORIGINS=<frontend-darkube-url>
```

Backend settings were not modified from this frontend phase.

## Issues and Findings

- This folder is not currently a Git repository.
- The exact backend schema filename requested by the prompt was absent; the available schema file is `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`.
- No prior frontend phase reports existed in `code_oder/v0.0/phaze1/`.
- `npm install` created `node_modules/`, and `npm run build` created `dist/`; both are ignored.
- Starting the local dev server created `vite-dev.log` and `vite-dev.err.log`; both match the `*.log` ignore rule.
- The Docker verification created local image `ratab-frontend-dev:test`; it was not pushed.

## Risks and Assumptions

- Assumed `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` is the authoritative OpenAPI schema because it is the available v0.0 schema file.
- Assumed the documented online dev backend URL remains the correct dev API base URL.
- Since `.env` is not created in this phase, local development should copy `.env.example` or set `VITE_API_BASE_URL` before running the app if the health card should call the dev backend directly.
- The generated Vite bundle embeds the build-time `VITE_API_BASE_URL`; rebuild the Docker image if the dev backend URL changes.

## User Actions Required

- Review the Phase 1 health screen visually in a browser.
- Use `http://127.0.0.1:5173/` for the currently running local dev server.
- Confirm whether `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` should be kept as the schema filename or copied/renamed manually to `backend_docs/history/v0.0/OPENAPI.yaml`.
- Build and push the frontend dev image when ready:
  `docker build --build-arg VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir -t registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main -f docker/frontend/Dockerfile .`
  then `docker push registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main`.
- Create/update the Hamravesh app with image `registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main` and port `80`.
- After Hamravesh assigns a public frontend URL, update backend CORS/CSRF manually with that URL.

## Suggested Commit Message

chore(frontend-phase1): scaffold React app and online dev deploy setup

## Next Step

Run frontend Phase 2 only after the Phase 1 screen, generated schema types, and Docker image build are approved.
