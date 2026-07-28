# Ratab Frontend Project Explain — v1.0

Last updated: 2026-07-28  
Active version file: `code_oder/active_version.txt`  
Current active frontend version: `v1.0`  
Backend contract version: `backend_docs/current/BACKEND_VERSION` = `v1.0`

Documentation root note: the repository uses `code_oder` as the folder name. Do not rename it unless the project owner explicitly requests a migration.

## Purpose

This file is the onboarding document for Frontend v1.0 work. Phase 1 established the baseline: the Backend v1.0 contract is synced under `backend_docs/current/`, OpenAPI types are regenerated from that contract, and the existing v0.0 product behavior remains in the running app until later phases replace specific areas.

Before changing code, read in this order:

1. `code_oder/active_version.txt`
2. `code_oder/v1.0/PROJECT_EXPLAIN.md` (this file)
3. `AI_CODE_PRINCIPLES.md`
4. `code_oder/COMMON_FRONTEND_CODEX_RULES.md`
5. `code_oder/v1.0/COMMON_FRONTEND_CODEX_RULES.md`
6. Every file under `backend_docs/current/`
7. The current phase instruction under `code_oder/v1.0/phazeN/`
8. Related source files

`backend_docs/current/BACKEND_VERSION` (backend contract) and `code_oder/active_version.txt` (frontend phase version) are separate identifiers.

Deep historical detail for unchanged v0 flows still lives in `code_oder/v0.0/PROJECT_EXPLAIN.md`. Prefer this v1.0 file for upgrade status, contract ownership, and obsolete assumptions.

## Phase 1 status (completed)

- Backend contract package present and validated as Backend `v1.0`.
- `npm run generate:api` reads `backend_docs/current/OPENAPI.yaml` → `src/shared/api/generated/schema.ts`.
- Schema regenerated successfully (OpenAPI 3.0.3, title `ratab v1.0 Backend API`, 58 paths, 108 schemas).
- Minimal TypeScript null-safety adjustments only where regenerated types became stricter.
- No signup/login/CSRF migration, members/groups, messaging, files, wallet, or subscription UI implemented in Phase 1.
- Working v0 browser behavior preserved (dev-token login, local messages, existing cost-report flows).

## Product snapshot (current running app)

The product remains a Persian-first, RTL construction cost-reporting frontend.

Current user journey (still v0-shaped in the UI):

1. Public landing page.
2. Dev phone login via `POST /api/auth/dev-login/` + `Authorization: Token …` in `sessionStorage`.
3. Protected company list / create.
4. Company dashboard with **local-only** messages, company info, projects, cost reports.
5. Cost report wizard: project → document → pricebook → coefficients → finalize/lock/print.

Brand note: principles say `ratab / رتب`; many UI strings still say `Metril / متریل`. Do not introduce a third brand.

## Technology

- React 19, TypeScript 5.7, Vite 6, React Router 7
- Redux Toolkit + RTK Query
- Tailwind CSS 3, lucide-react, Vazirmatn
- `react-multi-date-picker`, `three`/`gsap` (login visuals), `xlsx` (unwired Excel import)
- `openapi-typescript` for generated schema types

Package scripts:

| Script | Behavior |
| --- | --- |
| `npm run generate:api` | `node scripts/generate-api.mjs` → current OpenAPI → `schema.ts` |
| `npm run validate:docs` | documentation structure validator |
| `npm run dev` | generate:api + Vite |
| `npm run build` | generate:api + `tsc -b` + Vite build |
| `npm run lint` | generate:api + ESLint |
| `npm run preview` | serve `dist/` |

There is **no** `test` script in `package.json`.

## Backend contract (active)

Source package: `backend_docs/current/` (copied from backend `codexphaze/frontend_docs/`).

| File | Role |
| --- | --- |
| `BACKEND_VERSION` | `v1.0` |
| `OPENAPI.yaml` | Machine-readable contract |
| `FRONTEND_HANDOFF.md` | Behavioral guide |
| `AUTH_AND_CSRF.md` | Session + CSRF auth |
| `PERMISSIONS.md` | Role matrix |
| `ERROR_CODES.md` | Stable errors |
| `API_USAGE_EXAMPLES.md` | Examples |
| `INTEGRATION_CHECKLIST.md` | Implementation checklist |
| `KNOWN_LIMITATIONS.md` | Real limitations |
| `DB_SCHEMA_REFERENCE.dbml` | Informational only |

Do not depend on Django models, migrations, tables, admin, or backend internals.

## Runtime environment

- `VITE_API_BASE_URL` — API base URL (trimmed trailing slash in `baseApi.ts`).
- `VITE_DEFAULT_PRICE_SET_ID` — deprecated explicit document-step override only.

Current auth storage (v0, obsolete for normal v1 browser flow — replace in Phase 2):

- Key: `ratab.devAuth.token` in `sessionStorage`
- Header: `Authorization: Token <token>`

UI persistence unchanged: theme / onboarding / guided-tour flags in `localStorage`.

## Repository map

- `src/app/` — router, store, providers, shell context
- `src/pages/` — route pages
- `src/features/` — domain modules + RTK Query APIs
- `src/shared/api/` — `baseApi.ts`, generated `schema.ts`
- `backend_docs/current/` — active backend contract
- `backend_docs/history/` — historical contracts
- `docs/` — frontend product references and reports
- `code_oder/v1.0/` — v1 phase instructions and reports

## Routes (current)

Public:

- `/` — `RootPage` / landing
- `/login` — `LoginPage` (dev-login)
- `/status` — health

Protected (`RequireAuth` + `AppShell`):

- `/companies`, `/companies/new`, `/companies/:companyId`
- `/companies/:companyId/cost-reports/new`
- `/help`, `/settings`
- `/dashboard` → redirect `/companies`

## Redux / API architecture

Store: `auth`, `ui`, `ratabApi` (`baseApi`).

Feature APIs injecting into `baseApi`:

- `authApi` — `dev-login`, `auth/me`
- `companyApi`, `projectApi`, `pricebookApi`, `coefficientApi`, `financialDocumentApi`, `healthApi`

Tag types today: `Auth`, `Coefficient`, `Company`, `FinancialDocument`, `Health`, `Pricebook`, `Project`.

## Frontend API usage vs Backend v1.0 OpenAPI

All currently wired pricebook / company / project / coefficient / financial-document / health paths used by the live UI still exist under the v1 OpenAPI (v1 is a cumulative superset for those domains).

Endpoints present in frontend code but **absent from Backend v1.0 OpenAPI**:

| Frontend path | Notes |
| --- | --- |
| `POST /api/financial-documents/{id}/excel-plan/` | Used only by unwired Excel import modal |
| `POST /api/financial-documents/{id}/lines/bulk/` | Used only by unwired Excel import modal |

New Backend v1.0 domains **not yet consumed by the frontend** (later phases):

- Session auth: `/api/auth/csrf/`, signup/*, login, logout
- Members/roles: `/api/company-members/…`, role/deactivate
- Groups/messaging: `/api/companies/{id}/groups/`, `/api/company-groups/…`, messages
- Files/attachments: company files, storage-files, message-attachments
- Wallet: `/api/token-wallet/`, transactions
- Subscription/quota/payments: subscription-plans, subscription, message-quota, payments/orders

## Obsolete v0 assumptions (do not implement replacements in Phase 1)

Recorded for later phases:

1. **Primary browser auth is Token + `sessionStorage`** — v1 contract requires session cookie + CSRF (`credentials: "include"`, `X-CSRFToken`).
2. **`POST /api/auth/dev-login/` is the normal login UX** — compatibility only; forbidden as normal v1 path.
3. **Client-only logout** clears local token without `POST /api/auth/logout/`.
4. **No CSRF bootstrap** and no cookie credentials on `fetchBaseQuery`.
5. **Company messages are local React state** — must become group messaging APIs (Phase 4).
6. **Members / roles / groups UI are placeholders** — Phase 3.
7. **No private file upload/open** — Phase 5.
8. **No wallet / 5-token charge UX / idempotency_key on charged line creates** — Phase 6. OpenAPI already types `idempotency_key` on line create.
9. **No subscription / message-quota / disabled-payment UX** — Phase 7.
10. **Excel plan/bulk endpoints** assumed available — not in current OpenAPI; keep dead code until Phase 8 cleanup decides fate.
11. **HealthStatusPage still labels an old schema path** (`backend_docs/v0.0/openapi_v0_0.yaml`) — display-only drift.

## Behavior that must remain stable across early v1 phases

Unless a later phase’s contract work explicitly changes it:

- Pricebook browse, row codes as strings, calculate preview
- Coefficient sets/values and backend-authoritative calculation
- Financial document create/edit/recalculate/lock
- Browser print/preview path currently used in finalize
- RTL, responsive shell, dark/light theme
- Backend totals remain authoritative (no client financial truth)

## Remaining v1 phase integration map

| Phase | Integration focus |
| --- | --- |
| 2 | Session signup/login/logout/restore + CSRF; retire normal Token/`dev-login` browser flow |
| 3 | Company members, roles, groups; keep company/project flows |
| 4 | Persisted group messaging replacing local messages |
| 5 | Private files + message attachments |
| 6 | Wallet visibility + 5-token official line-create UX + idempotent retries |
| 7 | Subscription + message quota + disabled payment UX |
| 8 | Final contract re-sync, remove obsolete compatibility, regression, handoff |

## Known limitations (current)

- Auth still v0-shaped while Backend v1 session contract is documented.
- Messages local-only.
- Excel import unwired and calls removed OpenAPI paths.
- Backend PDF export may still be blocked (409) per contract limitations.
- Online payments disabled (`PAYMENTS_DISABLED`).
- Branding inconsistency (`ratab` vs `Metril`).
- No automated frontend test suite script yet.

## Safe change rules for later phases

1. Read `backend_docs/current/OPENAPI.yaml` and handoff before coding.
2. Regenerate with `npm run generate:api`; never hand-edit `schema.ts`.
3. Keep API access inside RTK Query/`baseApi`.
4. Do not invent endpoints, fields, errors, or permissions.
5. Do not commit/push or start the next phase automatically.
6. Update this file when behavior, routes, APIs, or limitations change.
