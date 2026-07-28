# Backend Docs (Frontend-Owned Index)

This directory holds **backend-delivered contracts** only. It is not frontend product documentation and not Codex phase output.

## Ownership

| Path | Role |
| --- | --- |
| `backend_docs/current/` | **Only** active backend integration contract for frontend work |
| `backend_docs/history/` | Historical contracts. Do **not** use for current implementation |
| Generated TypeScript | Remains under `src/shared/api/generated/` (frontend build artifact from OpenAPI) |

## Version concepts (do not conflate)

- `backend_docs/current/BACKEND_VERSION` identifies the **backend contract** currently being integrated.
- `code_oder/active_version.txt` identifies the **frontend implementation phase version**.

These versions are independent. A frontend version may integrate a different backend contract version after an explicit sync.

## Active contract: `current/`

`backend_docs/current/` must contain the complete package copied from the backend repository:

```text
<ratab_backend_repository>/codexphaze/frontend_docs/
```

Copy the **entire** package into `backend_docs/current/` as one unit. Do not invent, reconstruct, or hand-edit Backend v1 (or later) contract files from historical frontend copies.

Expected files after a valid sync (names as delivered by backend):

```text
backend_docs/current/
├── README.md
├── BACKEND_VERSION
├── OPENAPI.yaml
├── FRONTEND_HANDOFF.md
├── AUTH_AND_CSRF.md
├── PERMISSIONS.md
├── ERROR_CODES.md
├── API_USAGE_EXAMPLES.md
├── INTEGRATION_CHECKLIST.md
├── KNOWN_LIMITATIONS.md
└── DB_SCHEMA_REFERENCE.dbml
```

Until that package is copied, `current/` may contain only `.gitkeep`. Status: **CURRENT_BACKEND_CONTRACT_NOT_SYNCED**.

### Contract file roles

| File | Role |
| --- | --- |
| `OPENAPI.yaml` | Machine-readable API contract. Source for `npm run generate:api` |
| `FRONTEND_HANDOFF.md` | Behavioral integration guide |
| `AUTH_AND_CSRF.md` | Auth/CSRF behavior |
| `PERMISSIONS.md` | Permission model for UI gating |
| `ERROR_CODES.md` | Stable error codes |
| `API_USAGE_EXAMPLES.md` | Example request/response flows |
| `INTEGRATION_CHECKLIST.md` | Backend-provided integration checklist |
| `KNOWN_LIMITATIONS.md` | Backend-known gaps |
| `DB_SCHEMA_REFERENCE.dbml` | **Informational only** — never a frontend architecture dependency |
| `BACKEND_VERSION` | Backend contract version identifier |

### Hard rules

- Frontend code must **not** depend on Django models, migrations, database tables, backend services, or admin internals.
- `DB_SCHEMA_REFERENCE.dbml` is reference-only for understanding; do not design Redux/RTK Query around it.
- Never copy secrets, tokens, or backend `.env` files into this tree.
- Replace the contract package as **one unit**. Do not update individual current files without validating the whole package.
- Do not use `backend_docs/history/` for new feature work.

## Historical contracts: `history/`

Historical Backend v0 contracts live under:

```text
backend_docs/history/v0.0/
```

They document what Frontend v0.0 integrated against. They are not the active generation source.

## Backend synchronization checklist

1. Confirm backend package path: `<ratab_backend_repository>/codexphaze/frontend_docs/`.
2. Confirm frontend working tree is clean enough to review a contract-only sync (or isolate the sync commit).
3. Remove previous `backend_docs/current/*` contents (keep the directory; do not leave mixed old/new files).
4. Copy **all** files from the backend package into `backend_docs/current/` together.
5. Verify `BACKEND_VERSION`, `OPENAPI.yaml`, and `FRONTEND_HANDOFF.md` exist.
6. Verify no `.env`, credentials, tokens, or private secrets were copied.
7. Run `npm run validate:docs`.
8. Run `npm run generate:api` (only when `OPENAPI.yaml` is present).
9. Run TypeScript check, ESLint, and production build as appropriate for the integration task.
10. Record the sync in the relevant frontend phase/report docs — do not silently mix contract versions.

## OpenAPI TypeScript generation

```bash
npm run generate:api
```

Active source (when synced):

```text
backend_docs/current/OPENAPI.yaml
```

Output (unchanged):

```text
src/shared/api/generated/schema.ts
```

Do not hand-edit the generated schema. Do not run generation until a valid current `OPENAPI.yaml` exists.
