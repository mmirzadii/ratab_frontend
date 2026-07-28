# Documentation Reorganization Report

Date: 2026-07-28  
Scope: documentation ownership, backend-contract paths, indexes, package scripts, and structure validation only.  
Commit: **not created** (per task instructions).

## Summary

Frontend documentation was reorganized so ownership is unambiguous:

| Tree | Responsibility |
| --- | --- |
| `backend_docs/` | Backend-delivered contracts only (`current/` active, `history/` archive) |
| `code_oder/` | Frontend phase instructions, reports, rules, version explanations |
| `docs/` | Frontend-owned product/design references and documentation reports |
| `src/shared/api/generated/` | Generated TypeScript from OpenAPI (unchanged output path) |

No React feature code, API client behavior, Redux state, styling, backend source, credentials, or generated schema contents were intentionally changed in this task.

## Pre-reorganization inventory (SHA-256)

Documentation files inventoried before moves (excluding `node_modules/`, `dist/`, `.vite/`):

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `AI_CODE_PRINCIPLES.md` | 4361 | `ba265c8f63197f58f61e2004afe197a26a7465b1835a932c2c95…` |
| `backend_docs/v0.0/api_schema_security_notes.md` | 2705 | `7356d6c41aa93854961df6a96e634f446c63f779f4af19377c4d…` |
| `backend_docs/v0.0/frontend_handoff_v0_0.md` | 26795 | `878ca79257ad6e327b0050d4244969aeb5e8a02662b2d70f443a…` |
| `backend_docs/v0.0/openapi_v0_0.yaml` | 71716 | `1158b2cde43f54eabab18448e999bb0a7b3d94b719cf36f52dd628cf4b44e626` |
| `backend_docs/v0.0/ratab v0.0 Backend API.yaml` | 79973 | `4471c1316b7cfe3f656245212da13bf98d239766c931052435a019c8c0f112ce` |
| `code_oder/active_version.txt` | 5 | `dfebecf42784a31aa3d009dbcec0c657154a034b45f49cf22a89…` |
| `code_oder/COMMON_FRONTEND_CODEX_RULES.md` | 948 | `d2f68c7488b2cb7ddf093ed12573d0fbd8383ba87f6ecd6ba70b…` |
| `code_oder/RESET_FRONTEND_PHASE1_COMMANDS.md` | 970 | `982ae38ebbeefda904513f111942af443fc28fc78634c19c470b…` |
| `code_oder/RUN_FRONTEND_PHASE_PROMPT_TEMPLATE.md` | 3294 | `b7eaca7d22f86e35c946692e50bc4322c1ca27a6729ae960050a…` |
| `code_oder/v0.0/FRONTEND_PHASES_SUMMARY.md` | 1311 | `c1dc77f379136279ad34cd3b49a7bc51ea2695d93f320e36569b…` |
| `code_oder/v0.0/PROJECT_EXPLAIN.md` | 48893 | `74ef87bc0688d6259c654cde23a6a2a550407a7aaa52b502c66c…` |
| `code_oder/v0.0/reference/PRODUCT_FLOW_NOTES.md` | 2171 | `2e32e020e72008f6f1e98fb9b8864ee94bc13e0dc8d90fa41912b7266dd814f1` |
| `code_oder/v0.0/reference/UI_THEME_NOTES.md` | 954 | `3adc79ffcbbf0c98117c46138c9c88b41d47e91824c4608e5cfdb3f8dc1d74b8` |
| `code_oder/v0.0/reference/company_dual_nav_reference.png` | 149127 | `fa5e5096521487186568e022f5faad7c09d226347831d9dcf0777814743e954c` |
| `code_oder/v0.0/reference/landing_reference.html` | 1387 | `8fc21c58962991daa7b2f62fad089fa0acb50e03f66ccccb1055163ac88c2647` |
| `code_oder/v0.0/reference/main_updated.html` | 25655 | `e5814bc233d722a79a4ce69e058051b8e4eb2a4d24ad83101ea433b52ba8b4d5` |
| `code_oder/v0.0/phaze1/` … `phaze10/` | (all phase instruction/report/test files present) | preserved via in-place path updates only |

Full phase file set (30 files under `phaze1`–`phaze10`) was present and retained under the same phase folders.

Post-move hash verification for binary/unedited moved assets matched the pre-move hashes above for:

- both historical OpenAPI YAML files
- all five `docs/product_reference/v0.0/` assets

Handoff/security notes hashes changed only because path strings inside those files were updated.

## Original documentation tree

```text
backend_docs/
└── v0.0/
    ├── api_schema_security_notes.md
    ├── frontend_handoff_v0_0.md
    ├── openapi_v0_0.yaml
    └── ratab v0.0 Backend API.yaml

code_oder/
├── active_version.txt
├── COMMON_FRONTEND_CODEX_RULES.md
├── RESET_FRONTEND_PHASE1_COMMANDS.md
├── RUN_FRONTEND_PHASE_PROMPT_TEMPLATE.md
└── v0.0/
    ├── FRONTEND_PHASES_SUMMARY.md
    ├── PROJECT_EXPLAIN.md
    ├── reference/
    │   ├── PRODUCT_FLOW_NOTES.md
    │   ├── UI_THEME_NOTES.md
    │   ├── company_dual_nav_reference.png
    │   ├── landing_reference.html
    │   └── main_updated.html
    └── phaze1/ … phaze10/

docs/   (did not exist)
```

## Final documentation tree

```text
backend_docs/
├── README.md
├── current/
│   └── .gitkeep
└── history/
    └── v0.0/
        ├── README.md
        ├── OPENAPI.yaml
        ├── OPENAPI.NON_CANONICAL.openapi_v0_0.yaml
        ├── frontend_handoff_v0_0.md
        └── api_schema_security_notes.md

docs/
├── README.md
├── product_reference/
│   └── v0.0/
│       ├── PRODUCT_FLOW_NOTES.md
│       ├── UI_THEME_NOTES.md
│       ├── company_dual_nav_reference.png
│       ├── landing_reference.html
│       └── main_updated.html
└── reports/
    └── DOCUMENTATION_REORGANIZATION_REPORT.md

code_oder/
├── README.md
├── active_version.txt
├── COMMON_FRONTEND_CODEX_RULES.md
├── RESET_FRONTEND_PHASE1_COMMANDS.md
├── RUN_FRONTEND_PHASE_PROMPT_TEMPLATE.md
└── v0.0/
    ├── FRONTEND_PHASES_SUMMARY.md
    ├── PROJECT_EXPLAIN.md
    └── phaze1/ … phaze10/
```

## Moved-file mapping

| From | To |
| --- | --- |
| `backend_docs/v0.0/ratab v0.0 Backend API.yaml` | `backend_docs/history/v0.0/OPENAPI.yaml` (canonical) |
| `backend_docs/v0.0/openapi_v0_0.yaml` | `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` |
| `backend_docs/v0.0/frontend_handoff_v0_0.md` | `backend_docs/history/v0.0/frontend_handoff_v0_0.md` |
| `backend_docs/v0.0/api_schema_security_notes.md` | `backend_docs/history/v0.0/api_schema_security_notes.md` |
| `code_oder/v0.0/reference/PRODUCT_FLOW_NOTES.md` | `docs/product_reference/v0.0/PRODUCT_FLOW_NOTES.md` |
| `code_oder/v0.0/reference/UI_THEME_NOTES.md` | `docs/product_reference/v0.0/UI_THEME_NOTES.md` |
| `code_oder/v0.0/reference/company_dual_nav_reference.png` | `docs/product_reference/v0.0/company_dual_nav_reference.png` |
| `code_oder/v0.0/reference/landing_reference.html` | `docs/product_reference/v0.0/landing_reference.html` |
| `code_oder/v0.0/reference/main_updated.html` | `docs/product_reference/v0.0/main_updated.html` |

Moves used `git mv` where practical.

## Duplicate OpenAPI comparison

Both files: OpenAPI `3.0.3`, title `ratab v0.0 Backend API`, version `0.0`, **27 identical path keys**, security schemes `tokenAuth` + `cookieAuth`.

| File | Bytes | SHA-256 | Schemas |
| --- | ---: | --- | ---: |
| `ratab v0.0 Backend API.yaml` | 79973 | `4471c1316b7cfe3f656245212da13bf98d239766c931052435a019c8c0f112ce` | 64 |
| `openapi_v0_0.yaml` | 71716 | `1158b2cde43f54eabab18448e999bb0a7b3d94b719cf36f52dd628cf4b44e626` | 62 |

Schemas only in non-canonical:

- `PricebookCalculationInputSnapshot`

Schemas only in canonical:

- `PricebookCalculationInputSnapshotWithManual`
- `PricebookItemInputSpec`
- `PricebookRowBreakdown`

Canonical also includes richer shared calculate/line fields (`values`, `selected_row_id`, `footnotes`, `rows_breakdown`, etc.) used by Frontend v0 phases 5–10.

Note: the canonical file has a UTF-8 BOM; the non-canonical file does not.

## Historical canonical-file decision

**Chosen canonical:** former `ratab v0.0 Backend API.yaml` → `backend_docs/history/v0.0/OPENAPI.yaml`

Reasons:

1. It was the `package.json` `generate:api` source for later Frontend v0 work.
2. Phase 5 sync / phase 10 schema checks treated it as authoritative.
3. It is a contract superset for calculate/line schemas relative to the earlier export.

**Non-canonical archive:** former `openapi_v0_0.yaml` → `OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`, with unique older snapshot schema preserved and documented in `backend_docs/history/v0.0/README.md`.

No unique information was deleted.

## Broken links corrected

Updated living and phase documentation path references from:

- `backend_docs/v0.0/*` → `backend_docs/history/v0.0/*` (with canonical rename where applicable)
- `code_oder/v0.0/reference/*` → `docs/product_reference/v0.0/*`

Also corrected historical handoff/security notes that pointed at a nonexistent `docs/openapi_v0_0.yaml`.

Indexes added:

- `backend_docs/README.md`
- `backend_docs/history/v0.0/README.md`
- `docs/README.md`
- `code_oder/README.md`

## Package scripts changed

`package.json`:

| Script | Before | After |
| --- | --- | --- |
| `generate:api` | `openapi-typescript "backend_docs/v0.0/ratab v0.0 Backend API.yaml" -o src/shared/api/generated/schema.ts` | `node scripts/generate-api.mjs` |
| `validate:docs` | (missing) | `node scripts/validate-doc-structure.mjs` |

`scripts/generate-api.mjs`:

- Active source: `backend_docs/current/OPENAPI.yaml`
- Output unchanged: `src/shared/api/generated/schema.ts`
- If current OpenAPI is absent: prints `CURRENT_BACKEND_CONTRACT_NOT_SYNCED` and exits 0 without touching `schema.ts`

`scripts/validate-doc-structure.mjs` enforces the required structure checks from the task brief.

## Files intentionally left unchanged

- All React components, including `src/features/health/HealthStatusPage.tsx` (still displays the historical label `backend_docs/v0.0/openapi_v0_0.yaml` in UI copy; updating it would be a React/UI change outside this task)
- Redux slices, RTK Query APIs, styling, Vite app behavior
- `src/shared/api/generated/schema.ts` (not regenerated; current OpenAPI not synced)
- `code_oder/active_version.txt` (still `v0.0`; no approved Frontend v1 phase plan present)
- Backend source code / backend `.env` / secrets
- `node_modules/`, `dist/`, fonts, built assets
- No invented `backend_docs/current/` contract documents (only `.gitkeep`)

## Validation commands and real results

### `npm run validate:docs`

```text
STATUS: CURRENT_BACKEND_CONTRACT_NOT_SYNCED
history canonical OPENAPI sha256: 4471c1316b7cfe3f656245212da13bf98d239766c931052435a019c8c0f112ce
warnings:
  - backend_docs/current/ has no official backend package yet (only placeholder allowed)
OK: documentation structure checks passed
```

Exit code: **0**

### OpenAPI validation / `npm run generate:api`

Skipped substantive generation because `backend_docs/current/OPENAPI.yaml` does not exist yet.

```text
CURRENT_BACKEND_CONTRACT_NOT_SYNCED: backend_docs/current/OPENAPI.yaml is missing; skipping generate:api and keeping existing schema.ts
```

Exit code: **0**

### TypeScript check

```bash
npx tsc -b
```

Exit code: **0**

### ESLint

```bash
npx eslint .
```

Exit code: **0**

### Production build

```bash
npm run build
```

Result: generate:api skipped with `CURRENT_BACKEND_CONTRACT_NOT_SYNCED`, then `tsc -b` and Vite build succeeded (`✓ 1699 modules transformed`, built in ~12.29s).

Exit code: **0**

## Confirmations

- No application behavior intentionally changed by this documentation task
- No React feature implementation changes in this task
- No frontend API request/auth implementation changes in this task
- Generated schema was not manually edited and was not regenerated from historical YAML
- No backend source was copied; only existing frontend-held contract docs were relocated
- No credentials/secrets introduced
- No existing documentation file lost (all inventoried docs accounted for via move, archive rename, or retained phase folders)

## Unresolved ambiguity

1. **`HealthStatusPage` UI label** still shows `backend_docs/v0.0/openapi_v0_0.yaml`. Left unchanged to avoid React/UI edits; should be updated in a later UI/docs consistency task after current contract sync.
2. **`backend_docs/current/` is empty** pending official copy from `<ratab_backend_repository>/codexphaze/frontend_docs/`. Frontend must not invent those files.
3. **Pre-existing dirty working tree** already contained many `src/**` and style modifications unrelated to this documentation reorganization; those were not part of this task and were not reviewed as documentation changes.
4. Historical phase reports had path strings rewritten to the new archive locations so references resolve; command transcripts therefore no longer quote the original on-disk filenames exactly as executed in 2026 phase runs.

## Next sync step (not done here)

Copy the full backend package as one unit:

```text
<ratab_backend_repository>/codexphaze/frontend_docs/  →  backend_docs/current/
```

Then run:

```bash
npm run validate:docs
npm run generate:api
npx tsc -b
npx eslint .
npm run build
```
