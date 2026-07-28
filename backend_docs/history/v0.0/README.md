# Backend Contract History — v0.0

This folder archives the Backend v0.0 contract files that Frontend v0.0 used.

**Do not use these files for current implementation.** Active contracts belong only in `backend_docs/current/` after an official package sync from:

```text
<ratab_backend_repository>/codexphaze/frontend_docs/
```

## Files

| File | Role |
| --- | --- |
| `OPENAPI.yaml` | **Historical canonical** OpenAPI 3.0.3 contract for Backend v0.0 |
| `OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` | Earlier/partial duplicate OpenAPI export — **not** authoritative |
| `frontend_handoff_v0_0.md` | Historical behavioral handoff |
| `api_schema_security_notes.md` | Historical API docs security notes |

## Duplicate OpenAPI decision

Two OpenAPI files existed under the former path `backend_docs/v0.0/`:

1. `ratab v0.0 Backend API.yaml` (UTF-8 BOM, 79973 bytes)
2. `openapi_v0_0.yaml` (71716 bytes)

Comparison summary:

| Criterion | `ratab v0.0 Backend API.yaml` | `openapi_v0_0.yaml` |
| --- | --- | --- |
| OpenAPI version | 3.0.3 | 3.0.3 |
| `info.version` | `0.0` | `0.0` |
| Path count | 27 (identical path keys) | 27 |
| Schema count | 64 | 62 |
| Auth schemes | `tokenAuth`, `cookieAuth` | `tokenAuth`, `cookieAuth` |
| SHA-256 | `4471c1316b7cfe3f656245212da13bf98d239766c931052435a019c8c0f112ce` | `1158b2cde43f54eabab18448e999bb0a7b3d94b719cf36f52dd628cf4b44e626` |

Schemas only in the non-canonical file:

- `PricebookCalculationInputSnapshot` (narrower snapshot: `quantity`, `coefficient_set_id`)

Schemas only in the canonical file:

- `PricebookCalculationInputSnapshotWithManual`
- `PricebookItemInputSpec`
- `PricebookRowBreakdown`

Shared schemas also differ: the canonical file includes richer calculate/line fields used by later Frontend v0 phases (`values`, `selected_row_id`, `footnotes`, `rows_breakdown`, etc.).

### Decision

**Canonical historical file:** former `ratab v0.0 Backend API.yaml` → renamed to `OPENAPI.yaml`.

Reasons:

- It was the source configured in `package.json` `generate:api` for Frontend v0 phases 5–10.
- Phase reports (especially phase 5 sync and phase 10 schema checks) treated it as authoritative.
- It is a superset of the earlier export for calculate/line contracts.

**Non-canonical archive:** former `openapi_v0_0.yaml` → `OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`.

Preserved unique information: the older `PricebookCalculationInputSnapshot` schema name/shape, which the canonical file replaced with `PricebookCalculationInputSnapshotWithManual`. Early phase reports (phases 1–4) generated types from the non-canonical filename before the spaced canonical file existed.

## Original paths (pre-reorganization)

```text
backend_docs/v0.0/api_schema_security_notes.md
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/openapi_v0_0.yaml
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```
