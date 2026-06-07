# Frontend v0.0 Phase 9 — Preview, Export, QA, and Dev Handoff

## Phase goal

Finalize preview/export UI, QA the v0.0 frontend demo flow, and prepare handoff/deploy notes.

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

1. Implement HTML preview.
2. Render backend HTML safely.
3. Export creation UI.
4. Handle 409 for unavailable PDF download.
5. Show PDF unavailable message.
6. Manual smoke path: login, company, add صورت‌بها, browse, calculate, coefficients, document, preview.
7. Update README with env setup and known limitations.
8. Confirm Docker image build instructions.

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
code_oder/v0.0/phaze9/REPORT.md
code_oder/v0.0/phaze9/TEST_RESULTS.md
```

## Suggested commit message

```text
test(frontend-phase9): verify frontend demo flow and preview export behavior
```
