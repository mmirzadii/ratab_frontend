# Common Frontend Rules — Ratab v1.0 Upgrade

## Read before every phase

Read these sources before changing code:

1. `AI_CODE_PRINCIPLES.md`
2. `code_oder/COMMON_FRONTEND_CODEX_RULES.md`
3. this file
4. `code_oder/active_version.txt`
5. `code_oder/v0.0/PROJECT_EXPLAIN.md`
6. `code_oder/v1.0/PROJECT_EXPLAIN.md` when it exists
7. every file under `backend_docs/current/`
8. the current phase instruction
9. completed reports from earlier v1 phases
10. the related frontend source, routes, state, API modules, generated types, and tests

The current implementation and `backend_docs/current/OPENAPI.yaml` are the source of truth. Do not invent endpoints, fields, errors, permissions, or business rules.

## Scope

- Upgrade the existing frontend from v0.0 to v1.0; do not recreate it.
- Preserve the working pricebook, calculation, coefficient, project, financial-document, lock/finalize, preview/print, RTL, responsive, and theme behavior unless the active backend contract requires a change.
- Do not modify backend source code.
- Do not implement later-version features unrelated to v1.0.
- Do not add a dependency without a clear need.
- Do not commit, push, rewrite Git history, or start the next phase automatically.

## Backend contract

- Use only `backend_docs/current/` for current integration.
- Treat `OPENAPI.yaml` as the machine-readable contract and the other files as behavioral guidance.
- Treat `DB_SCHEMA_REFERENCE.dbml` as informational only.
- Frontend code must not depend on Django models, migrations, database tables, admin internals, or backend service internals.
- Never copy backend secrets, `.env` values, credentials, cookies, session identifiers, or private URLs into frontend code or docs.

## API and architecture

- Keep API access in the existing RTK Query/shared API architecture.
- Do not hardcode backend URLs in components.
- Do not manually edit the generated OpenAPI TypeScript schema.
- Regenerate API types from `backend_docs/current/OPENAPI.yaml`.
- Keep financial calculations and totals backend-authoritative.
- Preserve pricebook row codes as strings, including leading zeros.
- Use focused components and reuse current patterns instead of broad rewrites.

## Authentication and security

The v1 browser flow uses server-side sessions and CSRF.

- Do not store passwords, session IDs, or auth secrets in localStorage/sessionStorage.
- Do not use the old v0 `Authorization: Token` flow as the normal v1 browser flow.
- Send cookies and follow the backend CSRF contract.
- Restore the session through the current-user/session endpoint.
- Logout through the backend and clear frontend auth/API state.
- UI visibility is not authorization; backend permissions remain authoritative.
- Open private files and attachments only through backend-authorized endpoints.
- Never log sensitive authentication, file, or payment data.

## Billing and quota

- A successfully created official pricebook-backed financial-document line costs exactly 5 tokens.
- The frontend never chooses or calculates the charge.
- Use the backend idempotency contract for charged line creation and safe retries.
- Do not present browsing, previews, failures, edits, deletes, recalculation, export, or standalone starred lines as charged.
- Do not build a client-side wallet ledger or fake payment success.
- Online payment remains disabled in v1.0.

## Phase files and reports

All files for a phase belong inside its existing folder:

```text
code_oder/v1.0/phazeN/
```

Do not create another numbered output folder.

At the end of every phase, update:

- `code_oder/v1.0/PROJECT_EXPLAIN.md`
- `code_oder/v1.0/README.md`
- the current phase `README.md`
- the current phase `REPORT.md`
- the current phase `TEST_RESULTS.md`
- the current phase `USER_ACTIONS_REQUIRED.md`

Record exact commands and real results. Write `Not run` with the real reason when a check cannot run. Do not claim success without evidence.

Stop after the current phase and wait for review.
