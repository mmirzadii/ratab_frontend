# Frontend documentation — ratab backend (canonical)

This folder is the **sole canonical frontend integration package** for the
current ratab backend.

## Backend version

Read `BACKEND_VERSION`. It is currently:

```text
v1.0
```

That value is the cumulative effective backend state: all still-supported
behavior originally built in v0.0, plus all additions and replacements from
v1.0. Where an older behavior was replaced (for example development token
login), only the current contract is documented here.

## Source-of-truth rules

1. `OPENAPI.yaml` is the machine-readable API contract.
2. `FRONTEND_HANDOFF.md` is the behavioral integration guide for workflows that
   OpenAPI cannot fully describe.
3. The other Markdown files in this folder supplement those two sources.
4. `DB_SCHEMA_REFERENCE.dbml` is **informational only**. Frontend code must not
   depend on table names, foreign keys, Django models, migrations, admin, or
   backend service internals.
5. Phase folders under `codexphaze/v0.0/` and `codexphaze/v1.0/` are backend
   history. They are **not** frontend contracts.
6. Do not copy secrets, credentials, session IDs, CSRF secrets, private URLs,
   database URLs, Redis URLs, or storage credentials into a frontend repository.
7. When this package is copied into a frontend repository, keep these files
   together as one package.

## File index

| File | Contents |
| --- | --- |
| `BACKEND_VERSION` | Active cumulative backend version string |
| `OPENAPI.yaml` | Generated OpenAPI 3 schema for all current `/api/` endpoints |
| `FRONTEND_HANDOFF.md` | End-to-end integration guide |
| `AUTH_AND_CSRF.md` | Session cookies, CSRF, signup/login/logout |
| `PERMISSIONS.md` | Role and access matrix as enforced by the backend |
| `ERROR_CODES.md` | Stable frontend-relevant errors |
| `API_USAGE_EXAMPLES.md` | Realistic request/response examples |
| `INTEGRATION_CHECKLIST.md` | Practical frontend implementation checklist |
| `KNOWN_LIMITATIONS.md` | Real current limitations and owner decisions |
| `DB_SCHEMA_REFERENCE.dbml` | Informational domain schema snapshot |

## What the frontend must not do

- Use phase reports or Django source as the primary API guide
- Use `Authorization: Token …`, localStorage/sessionStorage for passwords or
  session IDs, or the old `dev-login` flow as normal authentication
- Treat public permanent file URLs, client-chosen token costs, or client-chosen
  payment amounts/status as valid
- Enforce security only in the UI
