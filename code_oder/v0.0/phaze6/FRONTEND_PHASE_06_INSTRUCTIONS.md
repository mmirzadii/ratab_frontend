# Frontend v0.0 Phase 6 — Item Modal, Footnotes, Requirements, Starred/Manual Price, and Calculation

## Phase goal

Implement item modal with price, footnotes, requirements, starred/manual price UI, and backend calculation.

## Required pre-read

```text
AI_CODE_PRINCIPLES.md
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
code_oder/COMMON_FRONTEND_CODEX_RULES.md
docs/product_reference/v0.0/main_updated.html
docs/product_reference/v0.0/UI_THEME_NOTES.md
docs/product_reference/v0.0/PRODUCT_FLOW_NOTES.md
```

## Required tasks

1. Show item title, row ids, unit, price, footnotes, requirments, calculation input.
2. Expandable footnotes.
3. Starred price input under footnote when needed.
4. قیمت ستاره‌دار form for missing official price.
5. Never treat missing price as zero.
6. Disable unsupported manual price submission with Persian message.
7. Call calculate endpoint.
8. Show backend-calculated totals.

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
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
```

If the required product UX is unsupported by backend, report the mismatch instead of faking behavior.

## Tests/checks

Run `npm run build`, `npm run lint`, and tests if configured. If Dockerfile changes, run the documented Docker build test. Do not run Docker push.

## Reports

Create/update only:

```text
code_oder/v0.0/phaze6/REPORT.md
code_oder/v0.0/phaze6/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase6): add item modal and calculation flow
```
