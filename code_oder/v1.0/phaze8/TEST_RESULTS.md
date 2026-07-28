# Phase 8 Test Results

Date: 2026-07-28  
Environment: local Windows, workspace `d:\work\ratab\ratab_frontend`  
Package version under test: `1.0.0`

## Commands and results

### Documentation validation

```text
Command: npm run validate:docs
Exit code: 0
Result:
  STATUS: CURRENT_BACKEND_CONTRACT_SYNCED
  history canonical OPENAPI sha256: 4471c1316b7cfe3f656245212da13bf98d239766c931052435a019c8c0f112ce
  OK: documentation structure checks passed
```

### OpenAPI TypeScript generation

```text
Command: npm run generate:api
Exit code: 0
Result:
  openapi-typescript 7.13.0
  backend_docs/current/OPENAPI.yaml → src/shared/api/generated/schema.ts (~149–205ms)
```

### TypeScript

```text
Command: npx tsc -b --force
Exit code: 0
Result: no diagnostics
```

### ESLint

```text
Command: npm run lint
Exit code: 0
Result:
  generate:api succeeded
  eslint . clean
```

### Production build

```text
Command: npm run build
Exit code: 0
Result:
  generate:api succeeded
  tsc -b succeeded
  vite build succeeded (built in ~5.56s)
  Chunk size warnings only (pre-existing large bundles)
```

### Docker image build

```text
Command: docker build -f docker/frontend/Dockerfile --build-arg VITE_API_BASE_URL=http://localhost:15000 -t ratab-frontend:v1.0-phase8-check .
Exit code: 0
Result:
  multi-stage build completed
  npm ci + npm run build inside node:22-alpine succeeded
  nginx:1.27-alpine runtime stage produced image ratab-frontend:v1.0-phase8-check
  npm audit inside build logged existing dependency advisories (informational)
```

### Host Nginx config test

```text
Command: nginx -t -c docker/frontend/nginx.conf
Status: Not run
Reason: nginx binary is not installed on the Windows host.
        Nginx config is exercised indirectly by the successful Docker runtime image build.
```

### Automated frontend tests

```text
Status: Not run
Reason: package.json has no test / vitest / jest / playwright script or suite.
        No *.test.* / *.spec.* files exist in the frontend repo.
```

### Live regression (requires Backend v1)

| Suite | Status | Reason |
| --- | --- | --- |
| Authentication (signup/login/logout/restore/CSRF) | Not run | No live Backend v1 session exercised in this Phase 8 run |
| Company / permission regression | Not run | Same |
| Messaging / attachment regression | Not run | Same |
| Pricebook / financial-document regression | Not run | Same |
| Wallet / subscription / quota / disabled-payment regression | Not run | Same |

Manual checklist for controlled deployment (human):

1. Signup → verify → password → session restore after refresh.
2. Login / logout; confirm CSRF failures never show raw HTML.
3. Company create; members/roles/groups per `PERMISSIONS.md` UX.
4. Group message send, pagination, file + financial-document attachments open/download.
5. Pricebook calculate (no charge); official line create (−5 tokens, idempotent retry); starred line (no charge).
6. Settings: wallet, subscription/quota, payment probe → `PAYMENTS_DISABLED`.
7. RTL / theme / mobile nav smoke; `/status` health page shows current OpenAPI path.
8. Docker image serves SPA routes on refresh.

## Summary

| Check | Result |
| --- | --- |
| Documentation validation | Pass |
| OpenAPI generation | Pass |
| TypeScript | Pass |
| ESLint | Pass |
| Production build | Pass |
| Docker image build | Pass |
| Host nginx -t | Not run (no host nginx) |
| Automated frontend tests | Not available |
| Live backend regression suites | Not run |
