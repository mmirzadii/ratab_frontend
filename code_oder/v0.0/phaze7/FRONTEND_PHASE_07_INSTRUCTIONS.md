# Frontend v0.0 Phase 7 — Project Coefficients UI

## Phase goal

Implement coefficient set/value screens and integrate coefficient selection with item calculation.

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

1. Coefficient set list/create.
2. Coefficient value create/edit/delete.
3. Supported keys: regional, overhead, floor, proposal, custom_1, custom_2.
4. Supported scopes: project, chapter, row.
5. Positive multiplier validation.
6. Persian digit normalization.
7. Calculation modal can select coefficient set.
8. Show applied coefficients.

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
code_oder/v0.0/phaze7/REPORT.md
code_oder/v0.0/phaze7/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase7): add project coefficients UI and calculation integration
```
