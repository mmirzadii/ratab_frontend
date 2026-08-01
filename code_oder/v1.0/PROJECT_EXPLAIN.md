# Ratab Frontend Project Explain — v1.0 (Final)

Last updated: 2026-08-01  
Active version file: `code_oder/active_version.txt` = `v1.0`  
Backend contract: `backend_docs/current/BACKEND_VERSION` = `v1.0`  
Package version: `package.json` = `1.0.0`

Documentation root note: the repository uses `code_oder` as the folder name. Do not rename it unless the project owner explicitly requests a migration.

## Purpose

Onboarding and handoff document for Frontend v1.0 after Phases 1–11, including the calculation-based token policy correction (2026-07-30), Phase 11 multi-pricebook selection, the 2026-07-31 group/project hard-deletion + project-settings correction, and the 2026-08-01 safe math-expression correction for financial numeric inputs and the message composer. Phases 1–7 delivered contract sync, session auth, company workspace, messaging, files/attachments, wallet foundations, and subscription/quota/disabled-payment UX. Phase 8 finalized regression, cleanup, and documentation. Phase 9 simplified the company workspace into a compact Telegram-inspired RTL master-detail layout. Phase 10 adds messenger-like message status, edit, soft-delete, and forward driven by backend capability fields. Phase 11 selects one or more pricebook Editions per FinancialDocument via Backend Phase 11 `selected_pricebooks`. The 2026-07-30 correction replaces the obsolete 5-token official-line-create UX with backend-authoritative paid calculations, receipts, and company-wallet donation. The 2026-07-31 correction adds safe group/project hard deletion (preview + confirmation) and project metadata editing from the existing Group Info panel. The 2026-08-01 correction adds a whitelist math parser so users can type expressions like `3**4` or `sin(30)` in financial fields and the chat composer; only canonical numbers are sent to the backend.

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
| 6 | ✅ | Wallet foundations + (superseded) line-create billing; see 2026-07-30 calculation-billing correction |
| 7 | ✅ | Subscription, message quota, disabled payment UX |
| 8 | ✅ | Final integration, cleanup, regression, handoff |
| 9 | ✅ | Compact Telegram-inspired company workspace UX + text cleanup |
| 10 | ✅ | Message status, edit, soft-delete, forward (backend `can_*`) |
| 11 | ✅ | Multi-pricebook Document Info: family + year add-to-list; browser selector when count > 1 |
| — | ✅ | **2026-07-30 correction:** calculation-based token policy + company wallet |
| — | ✅ | **2026-07-31 correction:** group/project hard delete + project edit in Group Info |
| — | ✅ | **2026-08-01 correction:** safe math expressions in financial inputs + message composer |

## Product snapshot

Persian-first RTL construction cost-reporting app.

1. Public landing → signup (`/signup`) or login (`/login`) with session cookies.
   Signup password step: mandatory ≥6 characters (blocking); live non-blocking weak-password yellow warning; signup-complete errors classified by field so password `400`s are not shown as invalid tickets.
2. Protected company list / create.
3. Company workspace (`/companies/:id`): compact section tabs + context list + main pane for messages, members, and company info. Custom/normal group create is routed at `/companies/:id/groups/new` (Telegram-like desktop side panel / mobile full page; two-step draft; atomic `member_ids` invitations). Group info is a Telegram-like side panel (overview/edit/add-members). Group kind comes from backend `group_kind` / `is_public` / `group_type` / `project_id` (never title). Public groups never show delete. Ordinary groups with `can_delete` show `حذف گروه`; project groups show `حذف پروژه` after deletion-preview confirmation. Project-group edit patches the group with linked project fields in one mutation.
4. Cost report wizard: project → document → pricebook → coefficients → finalize/lock/print. Document Info keeps `نوع فهرست‌بها` (`Pricebook.title_fa`) and `سال` as separate pickers, then `افزودن` appends exact Editions to a selected-pricebooks list (chips). Create submits `pricebook_edition_ids`; after create, add/remove use document-pricebook endpoints. Existing drafts can mutate selections when unlocked; locked documents are read-only. The pricebook browser shows a compact family—year selector only when the document has more than one selection; normal lines include the active `document_pricebook_id`. Opening an official item modal creates one free backend calculation session; valid inputs auto-calculate after 500ms. The first successful calculation in that session may charge the backend official cost (default 2); later recalculations in the same open session are free. Add uses the latest receipt (`calculation_receipt_id`) with no second charge, or forces one immediate same-session calculation when the result is pending/stale. Insufficient combined balance is kept silent until the user clicks Add, then opens the shared purchase dialog → `/settings?tab=tokens`.
5. Account settings (`/settings?tab=account|tokens|subscription`): circular avatar + prominent header token chip; summary = plan/quota/status only; Token tab = compact wallet metrics, server package cards / demo Buy when available, **اهدای توکن به شرکت** (shared modal), collapsible transaction history.

Visual system: **Metril Corporate Blue** — semantic `--ui-*` tokens in `src/styles/index.css`, Tailwind `ui.*` aliases, shared components first. Light canvas is cool gray-blue (`#F5F7FB`); dark canvas navy (`#08111F`). Primary actions use brand blue (not emerald). See `docs/product_reference/v0.0/UI_THEME_NOTES.md`.

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
- Wallet: `/api/token-wallet/`, `/transactions/`; company wallet `/api/companies/{id}/token-wallet/`; donations `GET|POST /api/companies/{id}/token-donations/` (shared `DonateTokensModal`); calculation endpoints send `idempotency_key`; demo purchase when commerce allows
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
2. Conversation list (~304–352px): public `عمومی` pinned first; remaining groups keep **backend** `last_activity_at` order (newest activity first; no client alphabetical/kind sort). `+` menu for پروژه جدید / گروه جدید. Successful message send / group or project create invalidates the company group list so the active chat moves without losing selection or draft.
3. Main chat pane with sticky composer: Telegram-like auto-growing textarea (min ~44px, max ~160px / ~140px mobile via `scrollHeight`); Enter sends, Shift+Enter newline, IME-safe; one **افزودن** menu (فایل | صورت‌بها); empty chat and drawer use **افزودن صورت‌بها** to open the same list-first financial-document selector; project-linked chats lock the project; public/custom require project selection with visible **ایجاد پروژه جدید**. Cost-report wizard Project Selection step also exposes compact **افزودن پروژه** (shared `CreateProjectSheet`) unless `lockProject` is set.
4. Optional left Group Info side panel (Telegram-like internal views: `overview` / `edit` / `addMembers` / `memberDetails`). Default tab `اعضا`, plus صورت‌بهاها / فایل‌ها / لینک‌ها. Header pencil edits when `can_edit` (project groups edit linked Project metadata via `PATCH /api/company-groups/{id}/`; ordinary groups edit name/description). Members tab uses compact rows + FAB `افزودن عضو`; invitations stay pending until accepted. Hard delete (`حذف گروه` / `حذف پروژه`) appears only when `can_delete`; preview counts come from `.../deletion-preview/`; confirmation modal required; success navigates to Public and invalidates groups/projects/messages/documents. Desktop ~384–416px beside chat; mobile full-screen overlay.
5. Below `lg`: bottom section nav + mobile list↔detail.

Project/group creation and management remain available from the conversation UI (create menu + drawer), not as primary nav sections. Cost-report wizard still uses SecondaryNav and returns attachments to the originating conversation when `returnToGroupId` is set.

## Phase 10 message lifecycle

Outgoing bubbles show pending → sent (server time + one check) or failed+retry. Normal send no longer toasts `پیام ارسال شد.` Idempotent `client_message_id` prevents duplicate bubbles on retry.

Actions (ویرایش / حذف / بازارسال) come only from backend `can_edit` / `can_delete` / `can_forward`. Desktop uses a custom right-click menu; mobile uses long-press/overflow; both share one menu model.

Edit runs in the composer (banner + draft restore). Delete confirms then renders the backend tombstone. Forward opens a searchable same-company group modal (**current group included and selectable**, labeled `گفتگوی فعلی`); same-group success appends the new message in place. Preview shows real text or attachment/document title (no generic `پیام با پیوست`). Errors stay Persian-only.

Endpoints: `PATCH|DELETE /api/group-messages/{id}/`, `POST /api/group-messages/{id}/forward/`.

## Obsolete assumptions (resolved)

1. Token + `sessionStorage` primary browser auth → session + CSRF
2. `dev-login` as normal login UX → unused
3. Client-only logout → backend logout + local clear
4. Local-only company messages → persisted group messages
5. Members/groups placeholders → real workspace UI
6. No private files/attachments → Phase 5 contract
7. No wallet / idempotency → Phase 6 (later corrected to calculation billing)
8. No subscription / quota / disabled-payment UX → Phase 7
9. Health page schema path drift → Phase 8
10. Excel OpenAPI-absent paths → Phase 8 isolated/unwired (not deleted)
11. Multi-sidebar + dropdown-heavy company dashboard → Phase 9 compact master-detail workspace
12. Verbose internal developer text in user-facing UI → Phase 9 text cleanup (compact, action-oriented)
13. Obsolete fixed 5-token official-line-create UX → 2026-07-30 calculation-based billing + company wallet
14. Client alphabetical/kind conversation sorting → backend `last_activity_at` list order (public still pinned)
15. Send-success toast + no edit/delete/forward UX → Phase 10 in-bubble status + capability-gated lifecycle

## Behavior that must remain stable

- Pricebook browse; row codes as strings; local input validation
- Coefficient sets/values; backend-authoritative totals after paid calculation
- Financial document create/edit/recalculate/lock; browser print/preview (uncharged)
- RTL, responsive shell, dark/light theme
- Session cookie auth + CSRF
- Paid official/starred calculation with receipt-based Add (Add may fall back to one deliberate calculation when no fresh receipt); personal then company debit order; idempotent retries
- Quota/payment disable enforced by backend; UI is presentation only
- Company member roles `owner` / `admin` / `employee` with labels مالک / مدیر / کارمند; **inline** member settings in the Members master-detail main pane (not a modal); no ordinary Owner assignment

## Known limitations

- Cross-origin cookie/CORS must match the frontend origin for login/signup.
- Member settings load `GET /api/company-members/{id}/settings/` and save via `PATCH` with `permission_settings`. Employee shows the full configurable catalog; Admin shows inherited Employee capabilities read-only plus Admin-only switches. See `backend_docs/current/PERMISSIONS.md`.
- Accounts without passwords need admin password setup (backend).
- No standalone company file **list** API.
- Online payments disabled (`PAYMENTS_DISABLED`); admin activates tokens/subscriptions.
- Subscription plans / token packages may be unseeded; UI shows empty lists honestly.
- `FREE_PLAN_DAILY_MESSAGE_LIMIT` may be unset → unlimited messaging (usage still recorded).
- Wallet ledger shows newest page only (no documented pagination query params).
- Backend PDF export may return conflict while blocked.
- Excel import isolated/unwired (absent from OpenAPI).
- Branding inconsistency (`ratab` vs `Metril`).
- No automated frontend test suite beyond Node.js test runner; live E2E against a real backend is a deployment gate (see `phaze8/TEST_RESULTS.md`). Text cleanup tests in `src/features/ui/textCleanup.test.ts` guard against internal developer text reappearing in UI.
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

## Correction (2026-07-30) — Local/Development demo token purchase

- Packages and prices come from `GET /api/token-wallet/` → `token_packages` + `commerce`.
- Buy is enabled only when `commerce.demo_purchase_available` is true (never from a frontend env flag alone).
- Purchase uses `POST /api/payments/demo-purchase/` with `{package_code, idempotency_key}` only.
- First success **201** and exact replay **200** + `Idempotent-Replayed` both refresh wallet/transactions via RTK tags; no local balance math.
- Production remains disabled via backend `commerce` flags / `PAYMENTS_DISABLED` on real orders.

## Correction (2026-07-30) — dual wallets + shared donation

Two separate balances (never merged):

| Balance | Source | Where shown | Increased by | Decreased by |
| --- | --- | --- | --- | --- |
| Personal | `GET /api/token-wallet/` | Global `TokenBalanceChip` (amber) | Purchases / grants | Calcs (first) + donations |
| Company | `GET /api/companies/{id}/token-wallet/` | Company Settings + workspace `CompanyTokenBadge` (sky) | Member donations | Calcs (fallback after personal) |

Shared modal: `src/shared/components/DonateTokensModal.tsx`

- Title: `اهدای توکن به شرکت`
- Company Settings: company locked/preselected; primary action `اهدای توکن` for every active member (`donation_allowed`)
- Account Settings Token tab: active companies only; auto-preselect when exactly one; selector stays visible
- Idempotent `POST .../token-donations/`; invalidates personal `Wallet:BALANCE` + `CompanyWallet:{id}`; toast on success; no optimistic math; no withdrawal

Cache: personal wallet shared; company wallet keyed by company id (switch clears via skip/new key); calculation spend invalidates all `CompanyWallet` tags; purchase invalidates personal only.

## Correction (2026-08-01) — safe math expressions

Frontend-only whitelist math parser for financial numeric inputs and the message composer. Backend still receives only canonical Latin numbers. Full details: `code_oder/v1.0/MATH_EXPRESSION_CORRECTION.md`. Modules under `src/shared/math/`. Test script: `npm run test:math-expression`.

## Correction (2026-08-01) — keyboard shortcuts + mobile math hint

Centralized shortcuts (`Ctrl/⌘+S`, `Ctrl/⌘+K`, `Ctrl/⌘+/`, Escape layers), form Enter-to-next for registered data-entry forms, and desktop `Tab` / mobile `محاسبه` math result actions. See `code_oder/v1.0/KEYBOARD_SHORTCUTS_CORRECTION.md`. Tests: `npm run test:shortcuts`.
