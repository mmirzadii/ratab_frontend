# Ratab Frontend Project Explain — v1.0

Last updated: 2026-07-28  
Active version file: `code_oder/active_version.txt`  
Current active frontend version: `v1.0`  
Backend contract version: `backend_docs/current/BACKEND_VERSION` = `v1.0`

Documentation root note: the repository uses `code_oder` as the folder name. Do not rename it unless the project owner explicitly requests a migration.

## Purpose

This file is the onboarding document for Frontend v1.0 work. Phase 1 established the Backend v1.0 contract baseline and regenerated OpenAPI types. Phase 2 migrated browser authentication to session cookies + CSRF. Phase 3 integrated company members, roles, and groups. Later phases still replace messaging, files, wallet, and subscriptions.

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

## Phase 2 status (completed)

- Browser auth uses session cookies + CSRF (`credentials: "include"`, `X-CSRFToken`).
- Signup: `/signup` phone → verify → password → session.
- Login: `/login` phone + password → session.
- Session restore on boot via `SessionBootstrap` (`GET /api/auth/csrf/` then `GET /api/auth/me/`).
- Logout calls `POST /api/auth/logout/` then clears Redux auth + RTK Query cache.
- Cross-origin local setup: masked CSRF token comes from `/api/auth/csrf/` JSON (not `document.cookie`); backend must list the Vite origin in `CSRF_TRUSTED_ORIGINS` (e.g. `http://localhost:1000`).
- HTML Django CSRF error pages are never shown raw in the UI.
- Removed normal Token/`dev-login`/`sessionStorage` auth path.
- Members/groups UI landed in Phase 3; messaging/files/wallet/subscription UI still not implemented.

## Phase 3 status (completed)

- Company dashboard sections: Members and Groups (enabled in secondary + mobile nav).
- RTK Query: `companyMembersApi`, `companyGroupsApi`; tag types `CompanyMember`, `CompanyGroup`.
- Permission helpers follow `PERMISSIONS.md` (owner/admin/employee, last-owner protection, group creator rules).
- Company info edit disabled for employees; member management controls role-gated in UX only.
- Backend remains security authority; 403/409 still handled via API error toasts.
- Persistent messaging, attachments, files, wallet, subscriptions, payments not implemented.
- Phase 2 session + CSRF behavior preserved.

## Product snapshot (current running app)

The product remains a Persian-first, RTL construction cost-reporting frontend.

Current user journey:

1. Public landing page.
2. Signup (`/signup`) or login (`/login`) with session cookies.
3. Protected company list / create.
4. Company dashboard with **local-only** messages, company info, **members**, **groups**, projects, cost reports.
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

Auth (Phase 2 / Backend v1 browser contract):

- Session cookie (`sessionid`, HttpOnly) + CSRF cookie (`csrftoken`)
- All API calls use `credentials: "include"`
- Mutating requests send `X-CSRFToken`
- Auth Redux state: `status` (`unknown` | `authenticated` | `anonymous`) + `user`
- Do **not** store passwords, session IDs, or auth tokens in `localStorage` / `sessionStorage`
- Legacy `ratab.devAuth.token` is cleared on boot if present

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
- `/login` — phone + password login
- `/signup` — phone → verify → password signup
- `/status` — health

Protected (`RequireAuth` + `AppShell`):

- `/companies`, `/companies/new`, `/companies/:companyId`
- `/companies/:companyId/cost-reports/new`
- `/help`, `/settings`
- `/dashboard` → redirect `/companies`

## Redux / API architecture

Store: `auth`, `ui`, `ratabApi` (`baseApi`).

`baseApi` uses `credentials: "include"` and CSRF headers via `baseQueryWithCsrf`.

Feature APIs injecting into `baseApi`:

- `authApi` — csrf, signup start/verify/complete, login, logout, `auth/me`
- `companyApi`, `companyMembersApi`, `companyGroupsApi`
- `projectApi`, `pricebookApi`, `coefficientApi`, `financialDocumentApi`, `healthApi`

Tag types today: `Auth`, `Coefficient`, `Company`, `CompanyGroup`, `CompanyMember`, `FinancialDocument`, `Health`, `Pricebook`, `Project`.

## Frontend API usage vs Backend v1.0 OpenAPI

All currently wired pricebook / company / project / coefficient / financial-document / health paths used by the live UI still exist under the v1 OpenAPI (v1 is a cumulative superset for those domains).

Auth endpoints now consumed by the frontend: `/api/auth/csrf/`, signup/*, login, logout, me.

Company workspace endpoints now consumed by the frontend (Phase 3):

- `/api/companies/{id}/members/`
- `/api/company-members/{id}/`, `/role/`, `/deactivate/`
- `/api/companies/{id}/groups/`
- `/api/company-groups/{id}/`, `/deactivate/`, `/members/`
- `/api/company-group-memberships/{id}/`, `/deactivate/`

Endpoints present in frontend code but **absent from Backend v1.0 OpenAPI**:

| Frontend path | Notes |
| --- | --- |
| `POST /api/financial-documents/{id}/excel-plan/` | Used only by unwired Excel import modal |
| `POST /api/financial-documents/{id}/lines/bulk/` | Used only by unwired Excel import modal |

Backend v1.0 domains **not yet consumed** (later phases):

- Groups messaging: `/api/company-groups/…/messages/`, message-attachments
- Files/attachments: company files, storage-files
- Wallet: `/api/token-wallet/`, transactions
- Subscription/quota/payments: subscription-plans, subscription, message-quota, payments/orders

## Obsolete assumptions after Phase 2

Resolved in Phase 2:

1. Token + `sessionStorage` primary browser auth → replaced by session + CSRF.
2. `dev-login` as normal login UX → removed from frontend usage.
3. Client-only logout → backend logout + local clear.
4. Missing CSRF/credentials on API client → implemented.

Still outstanding for later phases:

5. **Company messages are local React state** — Phase 4.
6. ~~**Members / roles / groups UI are placeholders** — Phase 3.~~ ✅ completed in Phase 3.
7. **No private file upload/open** — Phase 5.
8. **No wallet / 5-token charge UX / idempotency_key on charged line creates** — Phase 6.
9. **No subscription / message-quota / disabled-payment UX** — Phase 7.
10. **Excel plan/bulk endpoints** absent from OpenAPI — Phase 8 cleanup.
11. **HealthStatusPage still labels an old schema path** — display-only drift.

## Behavior that must remain stable across early v1 phases

Unless a later phase’s contract work explicitly changes it:

- Pricebook browse, row codes as strings, calculate preview
- Coefficient sets/values and backend-authoritative calculation
- Financial document create/edit/recalculate/lock
- Browser print/preview path currently used in finalize
- RTL, responsive shell, dark/light theme
- Backend totals remain authoritative (no client financial truth)
- Session cookie auth + CSRF after Phase 2

## Remaining v1 phase integration map

| Phase | Integration focus |
| --- | --- |
| 2 | ✅ Session signup/login/logout/restore + CSRF |
| 3 | ✅ Company members, roles, groups; keep company/project flows |
| 4 | Persisted group messaging replacing local messages |
| 5 | Private files + message attachments |
| 6 | Wallet visibility + 5-token official line-create UX + idempotent retries |
| 7 | Subscription + message quota + disabled payment UX |
| 8 | Final contract re-sync, remove obsolete compatibility, regression, handoff |

## Known limitations (current)

- Cross-origin cookie/CORS configuration must match the frontend origin for real login/signup.
- Accounts without passwords need admin password setup (backend limitation).
- Messages local-only.
- Members/roles/groups UI is present; messaging still local.
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
