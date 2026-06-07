# Frontend v0.0 Phase 2 — Design System, RTL Theme, Light/Dark Mode, and Onboarding Base

## Phase goal

Convert the uploaded HTML design direction into reusable React/Tailwind components, RTL theme, theme toggle, and guided onboarding foundation.

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

1. Create shared UI primitives.
2. Create AppShell with right sidebar and sticky header.
3. Implement Redux theme slice with dark/light and local persistence.
4. Add ThemeToggle.
5. Create GuidedTour/onboarding base.
6. Build polished placeholder dashboard inspired by HTML.
7. Add Persian digit normalization utilities.

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
code_oder/v0.0/phaze2/REPORT.md
code_oder/v0.0/phaze2/TEST_RESULTS.md
```

## Suggested commit message

```text
feat(frontend-phase2): add RTL design system and onboarding foundation
```
