# Frontend v0.0 Phase 4 — Company List/Create and Company Dashboard Shell

## Phase goal

Implement company list/create flow, auto-entry into company dashboard, dual navigation, and messenger-like company messages default page.

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

1. Company list after login.
2. Prominent افزودن شرکت.
3. Create company form based on backend fields.
4. Navigate into company dashboard after creation.
5. Dual nav dashboard shell.
6. Default پیام‌های شرکت.
7. Messenger-like placeholder.
8. Bottom-left plus button for صورت‌بها.
9. Onboarding highlight for plus button.

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
code_oder/v0.0/phaze4/REPORT.md
code_oder/v0.0/phaze4/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase4): add company creation and dashboard shell
```
