# Ratab Frontend (v1.0)

Persian-first, RTL construction cost-reporting frontend for Backend v1.0.

Active frontend version: `code_oder/active_version.txt` → `v1.0`  
Active backend contract: `backend_docs/current/` (`BACKEND_VERSION` → `v1.0`)

## Stack

- React 19, TypeScript, Vite 6, React Router 7
- Redux Toolkit + RTK Query
- Tailwind CSS 3, Vazirmatn, lucide-react

## Prerequisites

- Node.js 22+ (Dockerfile uses `node:22-alpine`)
- A running Backend v1.0 API with session cookies + CORS/CSRF configured for the frontend origin

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
VITE_API_BASE_URL=http://localhost:15000
```

Notes:

- No trailing slash on `VITE_API_BASE_URL`.
- Browser auth uses **session cookies + CSRF** (`credentials: "include"`, `X-CSRFToken`). Do not put passwords, session IDs, or CSRF secrets in env files or UI.
- For local Vite on `http://localhost:1000`, the backend must trust that origin (non-secret examples in `.env.example`): `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS=true`.
- Local signup verification may use backend `SIGNUP_VERIFICATION_MODE=local_any_code` (local debug only).
- `VITE_DEFAULT_PRICE_SET_ID` is deprecated; normal flow uses the backend active price set.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run generate:api` | Regenerate `src/shared/api/generated/schema.ts` from `backend_docs/current/OPENAPI.yaml` |
| `npm run validate:docs` | Validate documentation / contract sync structure |
| `npm run dev` | generate:api + Vite dev server (`http://localhost:1000`) |
| `npm run lint` | generate:api + ESLint |
| `npm run build` | generate:api + `tsc -b` + production Vite build |
| `npm run preview` | Serve `dist/` |

There is **no** automated test script (`test` / vitest / jest / playwright) in this package.

## Local run

```bash
npm ci
cp .env.example .env.local   # then edit VITE_API_BASE_URL
npm run dev
```

Open `http://localhost:1000`. Health check: `/status`.

## Docker

```bash
docker build \
  -f docker/frontend/Dockerfile \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t ratab-frontend:v1.0 .
```

Runtime image serves `dist/` with Nginx SPA fallback (`docker/frontend/nginx.conf`, port 80). `VITE_API_BASE_URL` is baked in at build time.

## Product surface (v1.0)

- Session signup / login / logout / restore + CSRF
- Companies, projects, members, roles, groups
- Persisted group messages + private file / financial-document attachments
- Pricebooks, calculate preview, coefficients, financial documents (lock / preview / export metadata)
- Wallet balance/ledger + exact 5-token official pricebook-line charge UX (idempotent retries)
- Subscription + daily message quota visibility; disabled online payment UX

## Documentation map

| Path | Role |
| --- | --- |
| `code_oder/v1.0/PROJECT_EXPLAIN.md` | Frontend v1 onboarding + status |
| `code_oder/v1.0/README.md` | Phase upgrade index |
| `code_oder/v1.0/phazeN/` | Phase instructions and reports |
| `backend_docs/current/` | Backend contract (do not invent APIs) |
| `docs/` | Frontend product/design references |

## Security notes

- Never display raw backend HTML error pages (CSRF failures are mapped to safe Persian messages).
- Never log or render session IDs, CSRF secrets, passwords, private file URLs, or payment credentials.
- Private files open only through authorized API endpoints (session cookies).
- UI role hiding is UX only; the backend is the security authority.

## Known limitations

See `code_oder/v1.0/PROJECT_EXPLAIN.md` and `backend_docs/current/KNOWN_LIMITATIONS.md`. Highlights: online payments disabled; plan/package seeding may be empty; PDF export may be blocked; Excel plan/bulk UI is isolated/unwired (paths absent from current OpenAPI); no automated frontend test suite.
