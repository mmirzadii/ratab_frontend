# Ratab Frontend v0.0 Phase Plan — Updated for Schema and Online Dev

Technology:

```text
React + TypeScript + Vite + Redux Toolkit + RTK Query + Tailwind CSS
```

Backend references:

```text
backend_docs/current/                 (active when synced)
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
```

Design/flow references:

```text
docs/product_reference/v0.0/main_updated.html
docs/product_reference/v0.0/UI_THEME_NOTES.md
docs/product_reference/v0.0/PRODUCT_FLOW_NOTES.md
docs/product_reference/v0.0/company_dual_nav_reference.png
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
