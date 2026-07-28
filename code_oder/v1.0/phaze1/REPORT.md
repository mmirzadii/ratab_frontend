# Phase 1 Report — v1 Baseline and Backend Contract Sync

Date: 2026-07-28  
Frontend active version after phase: `v1.0`  
Backend contract version: `v1.0`

## Understanding

Phase 1 creates a safe Frontend v1.0 baseline: inspect the existing app, verify the copied Backend v1.0 contract, regenerate OpenAPI TypeScript types, document the real codebase, and record obsolete v0 assumptions for later phases. It does **not** migrate auth, members, messaging, files, wallet, or subscriptions.

## Contract validation

### Completeness

All required files are present under `backend_docs/current/`:

- `README.md`
- `BACKEND_VERSION` → `v1.0`
- `OPENAPI.yaml`
- `FRONTEND_HANDOFF.md`
- `AUTH_AND_CSRF.md`
- `PERMISSIONS.md`
- `ERROR_CODES.md`
- `API_USAGE_EXAMPLES.md`
- `INTEGRATION_CHECKLIST.md`
- `KNOWN_LIMITATIONS.md`
- `DB_SCHEMA_REFERENCE.dbml`

`npm run validate:docs` reported `CURRENT_BACKEND_CONTRACT_SYNCED`.

### Internal consistency

- `BACKEND_VERSION` = `v1.0`
- OpenAPI `info.title` = `ratab v1.0 Backend API`, `info.version` = `1.0`, OpenAPI `3.0.3`
- Auth endpoints in `AUTH_AND_CSRF.md` are present in OpenAPI (`/api/auth/csrf/`, signup start/verify/complete, login, me, logout). Compatibility `dev-login` remains in OpenAPI and is documented as non-normal for v1 browsers.
- Handoff domains (members, groups, messages, files, wallet, quota, payments-disabled) appear as OpenAPI paths.
- No contradiction found that blocks Phase 1 baseline work.
- Backend-known OpenAPI generation warnings (coefficient/financial serializer hints) are documented in `KNOWN_LIMITATIONS.md` and are not frontend blockers.

OpenAPI stats:

| Metric | Value |
| --- | --- |
| Paths | 58 |
| Schemas | 108 |
| SHA-256 | `d3aec595bbfc7452410d93e12751826e4617a80bcca00b25deb51c052359540f` |
| vs historical v0 paths | cumulative superset (no historical v0 path removed) |

## OpenAPI generation

Already configured before this phase:

```text
generate:api → node scripts/generate-api.mjs
source → backend_docs/current/OPENAPI.yaml
output → src/shared/api/generated/schema.ts
```

No package-script path change was required beyond confirming the active source is `backend_docs/current/OPENAPI.yaml`.

Generation result: success (`openapi-typescript` 7.13.0). Schema grew from ~2163 lines (historical v0 types) to ~4138 lines. The generated file was **not** manually edited.

## Code changes in this phase

Functional feature work: **none** (no auth/session/CSRF/members/messages/files/wallet/subscription UI).

Minimal TypeScript adjustments required so regenerated stricter nullability still type-checks without changing runtime behavior:

1. `ItemDetailModal.tsx` — null-safe `value_key` sort (`?? 0`).
2. `ProjectCoefficientPanel.tsx` — use `coefficient_key ?? key` for labels; narrow validated create/update body before `find`.

Documentation updates:

- `code_oder/active_version.txt` → `v1.0`
- `code_oder/v1.0/PROJECT_EXPLAIN.md` (created)
- `code_oder/v1.0/README.md`
- `code_oder/v1.0/phaze1/README.md`
- this report, `TEST_RESULTS.md`, `USER_ACTIONS_REQUIRED.md`

## Preserved v0 behavior

Intentionally left working as-is:

- Dev-login UI and Token header auth via `sessionStorage`
- Company list/create/dashboard
- Local-only company messages
- Cost report wizard, pricebook browse/calculate, coefficients
- Financial document lines/recalculate/lock and browser print preview
- RTL / theme / shell navigation
- Unwired Excel import modal code (still present; endpoints missing from v1 OpenAPI)

## Obsolete v0 assumptions found (for later phases)

1. Token + `sessionStorage` as primary browser auth → Phase 2 session/CSRF.
2. `dev-login` as normal login UX → Phase 2.
3. Client-only logout without `/api/auth/logout/` → Phase 2.
4. Missing `credentials: "include"` / CSRF headers on API client → Phase 2.
5. Local-only messages → Phase 4 group messaging.
6. Members/roles/groups placeholders → Phase 3.
7. No private files/attachments → Phase 5.
8. No wallet / 5-token confirmation / `idempotency_key` on charged line creates → Phase 6 (`idempotency_key` already in OpenAPI line-create schema).
9. No subscription / message-quota / disabled-payment UX → Phase 7.
10. Frontend still calls `excel-plan` and `lines/bulk`, which are **not** in Backend v1.0 OpenAPI → Phase 8 cleanup (Excel modal remains unwired).
11. Health status UI still displays an old schema path string → later cleanup.

## Remaining phase integration areas

| Phase | Exact area |
| --- | --- |
| 2 | `baseApi` credentials/CSRF; auth slice/storage; login/signup/logout/restore routes |
| 3 | company members/roles/groups APIs + dashboard management UI |
| 4 | replace local messages with group message list/create |
| 5 | multipart file upload + authorized open/download + attachments |
| 6 | wallet queries + charged line create UX + idempotent retries + 402 handling |
| 7 | subscription + message quota + `PAYMENTS_DISABLED` UX |
| 8 | remove obsolete Token/dev-login/excel dead paths; final regression |

## Risks / limitations

- Until Phase 2, the running app still authenticates with the obsolete Token/`dev-login` path against backends that may disable or restrict that compatibility endpoint outside local/dev.
- Regenerated types expose many v1 schemas the UI does not use yet; later phases must wire them carefully without inventing fields.
- Excel import code references removed OpenAPI endpoints; do not enable that UI until the contract is clarified or the code is redesigned.

## Stop

Phase 1 complete. Waiting for review before Phase 2.
