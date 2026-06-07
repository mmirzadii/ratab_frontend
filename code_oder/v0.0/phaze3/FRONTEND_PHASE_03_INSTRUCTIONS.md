# Frontend v0.0 Phase 3 — Phone-Based Dev Auth UI and Protected Shell

## Phase goal

Implement phone-based login/register UX and connect it safely to the backend dev auth contract.

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

1. Read auth schema.
2. Implement phone step.
3. Implement password/secret step only if backend supports it; otherwise report mismatch and use supported dev-login.
4. Store token safely.
5. Attach Authorization header.
6. Implement auth/me check.
7. Implement logout and protected routes.
8. Highlight create company after first login.

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
code_oder/v0.0/phaze3/REPORT.md
code_oder/v0.0/phaze3/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase3): add phone login and protected app shell
```
