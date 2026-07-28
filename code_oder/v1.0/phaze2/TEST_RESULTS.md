# Phase 2 Test Results

Date: 2026-07-28

## Local backend auth/CSRF integration (real)

Frontend origin: `http://localhost:1000`  
API: `http://localhost:15000`  
Method: Python cookie-jar client sending `Origin`/`Referer`, `credentials` cookies, and `X-CSRFToken` from `/api/auth/csrf/` JSON (mirrors browser cross-origin constraints).

### Before backend origin update

Signup `POST /api/auth/signup/start/` returned Django HTML 403:

`Origin checking failed - http://localhost:1000 does not match any trusted origins.`

### Backend env after fix

```bash
docker compose -f docker-compose.local.yml up -d backend --force-recreate
docker compose -f docker-compose.local.yml exec -T backend printenv CSRF_TRUSTED_ORIGINS
```

Result included:

`http://localhost:1000,http://127.0.0.1:1000,...`

### Full flow result

```text
GET  /api/auth/csrf/              -> 200 application/json
POST /api/auth/signup/start/      -> 201 application/json
POST /api/auth/signup/verify/     -> 200 application/json
POST /api/auth/signup/complete/   -> 201 application/json
GET  /api/auth/me/                -> 200 application/json
GET  /api/auth/csrf/              -> 200 (refresh after session rotate)
POST /api/auth/logout/            -> 204
GET  /api/auth/me/                -> 401
GET  /api/auth/csrf/              -> 200
POST /api/auth/login/             -> 200
GET  /api/auth/me/                -> 200
GET  /api/auth/csrf/              -> 200
POST /api/companies/              -> 201
GET  /api/auth/csrf/              -> 200
POST /api/auth/logout/            -> 204
ALL_AUTH_FLOWS_PASSED
```

No HTML error payloads in the passing run.

## Frontend validation commands

### API type generation

```bash
npm run generate:api
```

Exit code: **0**

### TypeScript

```bash
npx tsc -b
```

Exit code: **0**

### ESLint

```bash
npx eslint src/features/auth/csrf.ts src/shared/api/baseApi.ts src/shared/utils/apiError.ts
```

Exit code: **0**

### Automated auth/routing unit tests

```text
Not run: no test script in package.json
```

### Production build

```bash
npm run build
```

Exit code: **0** (`✓ 1702 modules transformed`)

## Summary

| Check | Result |
| --- | --- |
| Local signup with Origin `http://localhost:1000` | pass (after CSRF_TRUSTED_ORIGINS update) |
| Verify / password complete / login / me / logout | pass |
| CSRF-protected authenticated POST | pass |
| Raw HTML 403 shown in UI path | blocked by `getApiErrorMessage` sanitization |
| generate:api / tsc / eslint / build | pass |
| npm test | Not run (no script) |
