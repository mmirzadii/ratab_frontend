# Frontend v0.0 Phase 8 — Financial Documents Workflow

## Phase goal

Implement financial documents/cost reports: lines, totals, recalculate, lock, and snapshot-aware UI.

## Required pre-read

```text
AI_CODE_PRINCIPLES.md
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/ratab v0.0 Backend API.yaml
code_oder/COMMON_FRONTEND_CODEX_RULES.md
code_oder/v0.0/reference/main_updated.html
code_oder/v0.0/reference/UI_THEME_NOTES.md
code_oder/v0.0/reference/PRODUCT_FLOW_NOTES.md
```

## Required tasks

1. Document list/detail under active project.
2. Add line from calculated item.
3. Show line snapshots and backend totals.
4. Edit/delete if supported.
5. Recalculate.
6. Lock.
7. Read-only locked state.
8. Do not recompute official totals in frontend.

## UI/UX requirements

- Persian-first and RTL.
- Dark glassmorphism inspired by `main_updated.html`.
- Emerald/teal primary accents.
- User-friendly construction workflow.
- Light/dark compatibility.
- No Alpine.js or CDN scripts in final React code.

## Backend contract requirements

Use only:

```text
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```

If the required product UX is unsupported by backend, report the mismatch instead of faking behavior.

## Tests/checks

Run `npm run build`, `npm run lint`, and tests if configured. If Dockerfile changes, run the documented Docker build test. Do not run Docker push.

## Reports

Create/update only:

```text
code_oder/v0.0/phaze8/REPORT.md
code_oder/v0.0/phaze8/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase8): add financial document workflow
```
