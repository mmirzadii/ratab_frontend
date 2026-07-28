# Common Frontend Codex Rules — Ratab v0.0

Applies to every frontend phase.

## Technology

```text
React + TypeScript + Vite + Redux Toolkit + RTK Query + Tailwind CSS
```

## Required references

```text
AI_CODE_PRINCIPLES.md
backend_docs/README.md
backend_docs/current/   (active contract when synced)
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
docs/product_reference/v0.0/main_updated.html
docs/product_reference/v0.0/UI_THEME_NOTES.md
docs/product_reference/v0.0/PRODUCT_FLOW_NOTES.md
```

Prefer `backend_docs/current/` whenever it contains the official synced package. Historical v0 files are archive-only after that sync.

## Backend

```text
https://hw2momirzadipayload.darkube.ir
```

Use env:

```env
VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

## Docker decision

Local development remains:

```bash
npm run dev
```

Docker is for online dev/demo deployment:

```text
Vite build -> dist -> nginx/static server -> Hamravesh public frontend link
```

Do not publicly deploy Vite dev server.

## Reports

Only:

```text
code_oder/v0.0/phazeN/REPORT.md
code_oder/v0.0/phazeN/TEST_RESULTS.md
```
