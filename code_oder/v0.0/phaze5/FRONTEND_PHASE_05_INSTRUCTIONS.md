# Frontend v0.0 Phase 5 — Cost Report Wizard and Pricebook Chapter/Group Browser

## Phase goal

Implement add صورت‌بها wizard, default year 1404, chapter filters, group filters, and item browsing.

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

1. Plus button opens wizard.
2. Ask project/report name and backend-required fields.
3. Year defaults to 1404.
4. Map Project/FinancialDocument flow to backend contract.
5. Show chapter list.
6. Add 3-8 high-level chapter filter sections.
7. Show groups/items after chapter.
8. Group filter above items.
9. Item opens Phase 6-ready modal shell.
10. Preserve row codes as strings.

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
code_oder/v0.0/phaze5/REPORT.md
code_oder/v0.0/phaze5/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase5): add cost report wizard and pricebook browser
```
