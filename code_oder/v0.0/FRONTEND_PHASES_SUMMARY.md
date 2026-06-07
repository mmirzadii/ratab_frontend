# Ratab Frontend v0.0 Phase Plan — Updated for Schema and Online Dev

Technology:

```text
React + TypeScript + Vite + Redux Toolkit + RTK Query + Tailwind CSS
```

Backend references:

```text
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```

Design/flow references:

```text
code_oder/v0.0/reference/main_updated.html
code_oder/v0.0/reference/UI_THEME_NOTES.md
code_oder/v0.0/reference/PRODUCT_FLOW_NOTES.md
code_oder/v0.0/reference/company_dual_nav_reference.png
```

## Phases

1. Scaffold, Tailwind, Redux Toolkit, RTK Query, schema types, and online dev Docker deploy setup.
2. Design system, RTL theme, dark/light mode, guided onboarding base.
3. Phone-based dev auth UI and protected shell.
4. Company list/create and company dashboard shell with dual navigation.
5. Add cost report wizard and pricebook chapter/group browser.
6. Item modal, footnotes, requirements, starred/manual price UI, calculation.
7. Project coefficients UI and calculation integration.
8. Financial document lines, totals, recalculate, lock.
9. Preview/export UI, QA, demo readiness, and frontend handoff.

## Docker decision

Local dev:

```bash
npm run dev
```

Online dev/demo:

```text
Vite build -> nginx/static server Docker image -> Hamravesh app -> public frontend link
```
