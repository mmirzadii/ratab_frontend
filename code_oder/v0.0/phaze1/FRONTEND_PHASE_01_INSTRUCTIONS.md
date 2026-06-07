# Frontend v0.0 Phase 1 — Scaffold, Tailwind, Redux Toolkit, RTK Query, Schema Types, and Online Dev Docker

## Phase goal

Rebuild Phase 1 with the real backend schema imported, and add online dev Docker deployment support for sending a public frontend link to testers.

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

1. Scaffold/verify React + TypeScript + Vite.
2. Configure Tailwind.
3. Configure Redux Toolkit store.
4. Configure RTK Query base API.
5. Configure React Router.
6. Add `.env.example` with VITE_API_BASE_URL.
7. Read and use `backend_docs/v0.0/ratab v0.0 Backend API.yaml`.
8. Generate TypeScript API types if practical.
9. Add health/status page.
10. Add `docker/frontend/Dockerfile`, `docker/frontend/nginx.conf`, `.dockerignore` for static nginx deployment.
11. Document Hamravesh frontend app settings.

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
code_oder/v0.0/phaze1/REPORT.md
code_oder/v0.0/phaze1/TEST_RESULTS.md
```

## Suggested commit message

```text
chore(frontend-phase1): scaffold React app and online dev deploy setup
```
