# Ratab Frontend Project Explain — v1.0 (Final)

Last updated: 2026-07-28  
Active version file: `code_oder/active_version.txt` = `v1.0`  
Backend contract: `backend_docs/current/BACKEND_VERSION` = `v1.0`  
Package version: `package.json` = `1.0.0`

Documentation root note: the repository uses `code_oder` as the folder name. Do not rename it unless the project owner explicitly requests a migration.

## Purpose

Onboarding and handoff document for Frontend v1.0 after Phases 1–9. Phases 1–7 delivered contract sync, session auth, company workspace, messaging, files/attachments, wallet/5-token UX, and subscription/quota/disabled-payment UX. Phase 8 finalized regression, cleanup, and documentation. Phase 9 simplified the company workspace into a compact Telegram-inspired RTL master-detail layout without changing backend contracts.

Before changing code, read in this order:

1. `code_oder/active_version.txt`
2. `code_oder/v1.0/PROJECT_EXPLAIN.md` (this file)
3. `AI_CODE_PRINCIPLES.md`
4. `code_oder/COMMON_FRONTEND_CODEX_RULES.md`
5. `code_oder/v1.0/COMMON_FRONTEND_CODEX_RULES.md`
6. Every file under `backend_docs/current/`
7. Related source files
8. Phase reports under `code_oder/v1.0/phazeN/` when investigating history

`backend_docs/current/BACKEND_VERSION` (backend contract) and `code_oder/active_version.txt` (frontend phase version) are separate identifiers.

## Phase completion map

| Phase | Status | Focus |
| --- | --- | --- |
| 1 | ✅ | Backend contract baseline + OpenAPI type generation |
| 2 | ✅ | Session signup/login/logout/restore + CSRF |
| 3 | ✅ | Company members, roles, groups |
| 4 | ✅ | Persisted group messaging |
| 5 | ✅ | Private files + message attachments |
| 6 | ✅ | Wallet + 5-token official line-create + idempotency |
| 7 | ✅ | Subscription, message quota, disabled payment UX |
| 8 | ✅ | Final integration, cleanup, regression, handoff |
| 9 | ✅ | Compact Telegram-inspired company workspace UX |

## Product snapshot

Persian-first RTL construction cost-reporting app.

1. Public landing → signup (`/signup`) or login (`/login`) with session cookies.
   Signup password step: mandatory ≥6 characters (blocking); live non-blocking weak-password yellow warning; signup-complete errors classified by field so password `400`s are not shown as invalid tickets.
2. Protected company list / create.
3. Company workspace (`/companies/:id`): compact section tabs + context list + main pane for messages, members, groups, projects, and company info.
4. Cost report wizard: project → document → pricebook → coefficients → finalize/lock/print. Official pricebook line adds show the fixed 5-token cost and use idempotency keys.
5. Account settings (`/settings`): wallet, subscription/quota, disabled-payment boundary.

Brand note: principles say `ratab / رتب`; many UI strings still say `Metril / متریل`. Do not introduce a third brand.

## Technology

- React 19, TypeScript 5.7, Vite 6, React Router 7
- Redux Toolkit + RTK Query
- Tailwind CSS 3, lucide-react, Vazirmatn
- `react-multi-date-picker`, `three`/`gsap` (login visuals), `xlsx` (isolated/unwired Excel import only)
- `openapi-typescript` for generated schema types

| Script | Behavior |
| --- | --- |
| `npm run generate:api` | current OpenAPI → `schema.ts` |
| `npm run validate:docs` | documentation structure validator |
| `npm run dev` | generate:api + Vite (`:1000`) |
| `npm run build` | generate:api + `tsc -b` + Vite build |
| `npm run lint` | generate:api + ESLint |
| `npm run preview` | serve `dist/` |

There is **no** `test` script in `package.json`.

## Backend contract (active)

Source: `backend_docs/current/`

| File | Role |
| --- | --- |
| `BACKEND_VERSION` | `v1.0` |
| `OPENAPI.yaml` | Machine-readable contract |
| `FRONTEND_HANDOFF.md` | Behavioral guide |
| `AUTH_AND_CSRF.md` | Session + CSRF |
| `PERMISSIONS.md` | Role matrix |
| `ERROR_CODES.md` | Stable errors |
| `API_USAGE_EXAMPLES.md` | Examples |
| `INTEGRATION_CHECKLIST.md` | Checklist |
| `KNOWN_LIMITATIONS.md` | Real limitations |
| `DB_SCHEMA_REFERENCE.dbml` | Informational only |

Do not depend on Django models, migrations, tables, admin, or backend internals. Never hand-edit `schema.ts`.

## Runtime environment

See root `README.md` and `.env.example`.

- `VITE_API_BASE_URL` — API base (no trailing slash); baked into Docker builds
- `VITE_DEFAULT_PRICE_SET_ID` — deprecated explicit override only
- Auth: session cookie + CSRF; `credentials: "include"`; mutating requests send `X-CSRFToken`
- Boot clears obsolete `ratab.devAuth.token` from `sessionStorage` if present
- Do **not** store passwords, session IDs, or auth tokens in web storage

## Routes

Public: `/`, `/login`, `/signup`, `/status`  
Protected: `/companies`, `/companies/new`, `/companies/:companyId`, `/companies/:companyId/cost-reports/new`, `/help`, `/settings`  
`/dashboard` → `/companies`

## Redux / API

Store: `auth`, `ui`, `ratabApi` (`baseApi` + CSRF-aware `baseQueryWithCsrf`).

Feature APIs: `authApi`, `companyApi`, `companyMembersApi`, `companyGroupsApi`, `companyMessagesApi`, `companyFilesApi`, `projectApi`, `pricebookApi`, `coefficientApi`, `financialDocumentApi`, `healthApi`, `walletApi`, `subscriptionApi`.

Tag types: `Auth`, `Coefficient`, `Company`, `CompanyGroup`, `CompanyMember`, `FinancialDocument`, `GroupMessage`, `Health`, `MessageQuota`, `Pricebook`, `PrivateFile`, `Project`, `Subscription`, `Wallet`.

## Consumed Backend v1 endpoints (summary)

- Auth: csrf, signup/*, login, logout, me
- Companies / members / groups / messages / files / message-attachments
- Projects, pricebooks, coefficients, financial documents (CRUD/lines/recalculate/lock/preview/export)
- Wallet: `/api/token-wallet/`, `/transactions/`; line creates send `idempotency_key` for official pricebook-backed lines
- Subscription: `/api/subscription/`, `/api/subscription-plans/`, `/api/message-quota/`, payments probe `/api/payments/orders/`

### Isolated / not part of active product surface

| Path | Notes |
| --- | --- |
| `POST .../excel-plan/` | Absent from current OpenAPI; Excel modal unwired |
| `POST .../lines/bulk/` | Absent from current OpenAPI; Excel modal unwired |

`dev-login` remains in OpenAPI for backend compatibility history but is **not** used by the frontend.

## Phase 8 cleanup performed

- Health status page labels updated to `backend_docs/current/OPENAPI.yaml` (removed stale v0.0 schema path).
- Excel plan/bulk kept **isolated** (commented, unwired) rather than deleted without automated tests.
- Legacy v0 token storage module already absent; boot still clears `ratab.devAuth.token` if found.
- Root `README.md` added for integration/run/Docker/security handoff.
- `package.json` version set to `1.0.0`.

## Phase 9 workspace UX

Company workspace is conversation-first when `companyCtx.workspaceActive` is set:

1. Narrow company icon rail (~68px, `lg+`) — **گفتگوها**, اعضا, اطلاعات شرکت (no permanent Projects/Groups nav).
2. Conversation list (~304–352px): public `عمومی` pinned, then project-linked (با نشان `پروژه`), then custom; `+` menu for پروژه جدید / گروه جدید.
3. Main chat pane with sticky composer: one **افزودن** menu (فایل | صورت‌بها); empty chat and drawer use **افزودن صورت‌بها** to open the same list-first financial-document selector; project-linked chats lock the project; public/custom require project selection with visible **ایجاد پروژه جدید**.
4. Optional left info drawer (closed by default) with tabs صورت‌بهاها / فایل‌ها / لینک‌ها / اعضا; shared resources come from that group's messages; members from the group-members endpoint.
5. Below `lg`: bottom section nav + mobile list↔detail.

Project/group creation and management remain available from the conversation UI (create menu + drawer), not as primary nav sections. Cost-report wizard still uses SecondaryNav and returns attachments to the originating conversation when `returnToGroupId` is set.

## Obsolete assumptions (resolved)

1. Token + `sessionStorage` primary browser auth → session + CSRF
2. `dev-login` as normal login UX → unused
3. Client-only logout → backend logout + local clear
4. Local-only company messages → persisted group messages
5. Members/groups placeholders → real workspace UI
6. No private files/attachments → Phase 5 contract
7. No wallet / 5-token / idempotency → Phase 6
8. No subscription / quota / disabled-payment UX → Phase 7
9. Health page schema path drift → Phase 8
10. Excel OpenAPI-absent paths → Phase 8 isolated/unwired (not deleted)
11. Multi-sidebar + dropdown-heavy company dashboard → Phase 9 compact master-detail workspace

## Behavior that must remain stable

- Pricebook browse; row codes as strings; calculate preview
- Coefficient sets/values; backend-authoritative totals
- Financial document create/edit/recalculate/lock; browser print/preview
- RTL, responsive shell, dark/light theme
- Session cookie auth + CSRF
- Exact 5-token official line charge (backend authority); idempotent retries
- Quota/payment disable enforced by backend; UI is presentation only

## Known limitations

- Cross-origin cookie/CORS must match the frontend origin for login/signup.
- Accounts without passwords need admin password setup (backend).
- No standalone company file **list** API.
- Online payments disabled (`PAYMENTS_DISABLED`); admin activates tokens/subscriptions.
- Subscription plans / token packages may be unseeded; UI shows empty lists honestly.
- `FREE_PLAN_DAILY_MESSAGE_LIMIT` may be unset → unlimited messaging (usage still recorded).
- Wallet ledger shows newest page only (no documented pagination query params).
- Backend PDF export may return conflict while blocked.
- Excel import isolated/unwired (absent from OpenAPI).
- Branding inconsistency (`ratab` vs `Metril`).
- No automated frontend test suite; live E2E against a real backend is a deployment gate (see `phaze8/TEST_RESULTS.md`).
- Company/group invitation UX is wired against current OpenAPI invitation endpoints (`/api/company-invitations/`, company/group invitation creates, accept/reject). Pending invitations are listed separately from active companies on `/companies`.
- Live `GET /api/company-invitations/` may return a bare array; the frontend normalizes both array and paginated shapes.
- Company creation refreshes groups so the backend `عمومی` public group (`is_default` / `public_group_id`) appears without a client-side create.
- Project create sends `include_all_company_members_in_group` (default `true`) and invalidates project/group caches so the project group appears after backend confirmation.

## Integration and rollback

**Integrate:** point `VITE_API_BASE_URL` at Backend v1; configure CORS/CSRF trusted origins; regenerate types after any contract update (`npm run generate:api`); deploy static `dist/` or Docker image.

**Rollback:** redeploy previous frontend artifact / image; frontend has no DB migrations. Do not mix a v1 frontend with a v0-only API host. If backend contract rolls back, restore matching `backend_docs/current/` snapshot and regenerate types.

**Controlled deployment gate:** static build/lint/Docker validation passed in Phase 8; live auth/messaging/wallet/quota QA against a real backend remains a human checklist before broad production.

## Safe change rules

1. Read `backend_docs/current/OPENAPI.yaml` and handoff before coding.
2. Regenerate with `npm run generate:api`; never hand-edit `schema.ts`.
3. Keep API access inside RTK Query/`baseApi`.
4. Do not invent endpoints, fields, errors, or permissions.
5. Do not commit/push automatically.
6. Update this file when behavior, routes, APIs, or limitations change.
