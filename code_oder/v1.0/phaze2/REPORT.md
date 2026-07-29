# Phase 2 Report — Session Authentication, Signup, Login, and CSRF

Date: 2026-07-28  
Frontend active version: `v1.0`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)

## Understanding

Migrate browser authentication to Backend v1 session cookies + CSRF, then fix the real local failure where signup returned Django’s HTML 403:

`Origin checking failed - http://localhost:1000 does not match any trusted origins.`

## Root cause (local integration)

1. **Backend `CSRF_TRUSTED_ORIGINS`** (Docker local compose / `.env.local`) did not include `http://localhost:1000` while Vite serves on port **1000**.
2. **Cross-origin CSRF header source:** with `VITE_API_BASE_URL=http://localhost:15000`, the browser cannot read the API’s Host-only `csrftoken` via `document.cookie`. The client must send the masked `csrf_token` from `GET /api/auth/csrf/` JSON in `X-CSRFToken`.
3. **Session auth rotates CSRF:** after login/signup complete, the CSRF cookie rotates; the in-memory masked token must be cleared and refreshed before later mutations (logout, company create, etc.).

CSRF protection was **not** disabled. Token auth was **not** restored.

## Frontend fixes

### Shared API (`src/shared/api/baseApi.ts`)

- `credentials: "include"` on all requests.
- Bootstrap / refresh CSRF via `GET /api/auth/csrf/`.
- Store masked `csrf_token` from JSON in memory; send as `X-CSRFToken`.
- On mutating `403`, clear cached token, refresh CSRF once, retry.
- After successful `/api/auth/login/`, `/api/auth/signup/complete/`, `/api/auth/logout/`, clear cached CSRF (cookie rotation).
- No `Authorization: Token` header.

### Error UI (`src/shared/utils/apiError.ts`)

- Detect HTML / Django CSRF pages (`<!DOCTYPE html>`, `Origin checking failed`, etc.).
- Never surface raw HTML in the UI.
- Map those cases to a safe Persian message about CSRF trusted origins / access denial.
- Preserve JSON `detail` / field errors / stable `code` payloads from the contract.

### Auth UX (unchanged contract)

- `/signup`: phone → verify → password → session
- `/login`: phone + password → session
- `SessionBootstrap` + `RequireAuth`
- Backend logout via `POST /api/auth/logout/`

## Backend local environment (required for `http://localhost:1000`)

Non-secret values required on the running local backend:

```env
CSRF_TRUSTED_ORIGINS=http://localhost:1000,http://127.0.0.1:1000
CORS_ALLOWED_ORIGINS=http://localhost:1000,http://127.0.0.1:1000
CORS_ALLOW_CREDENTIALS=true
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
SIGNUP_VERIFICATION_MODE=local_any_code
```

Applied for local verification by updating:

- `ratab_backend/docker-compose.local.yml` backend environment
- `ratab_backend/.env.local`

Then recreating the backend container so `printenv CSRF_TRUSTED_ORIGINS` included `http://localhost:1000`.

Frontend safe example notes updated in `.env.example` (no secrets).

## Obsolete v0 auth

Still removed: Token headers, `sessionStorage` auth token writes, `dev-login` UI/API usage, client-only logout.

## Live local verification summary

Against `Origin: http://localhost:1000` → `http://localhost:15000`:

- CSRF bootstrap JSON 200
- Signup start/verify/complete succeeded (JSON, no HTML)
- Session restore via `/api/auth/me/` 200
- Logout 204 after CSRF refresh
- Login 200 + `/me/` restore
- CSRF-protected `POST /api/companies/` 201
- Final logout 204
- No raw HTML error bodies in successful flow

## Stop

Phase 2 complete after local CSRF/origin fix. Waiting for review before Phase 3.

---

## Post-v1 maintenance — signup password UX (2026-07-28)

Not a new phase. Approved correction to signup password completion:

- Client blocking rule: password length ≥ 6; red field message `رمز عبور باید حداقل ۶ کاراکتر باشد.`; submit disabled while unmet.
- Non-blocking yellow weak warning after length ≥ 6 (length &lt; 8, digits-only, letters-only, repeated character, or obvious local patterns). Never sent to backend; never disables submit.
- `classifySignupCompleteError` maps `password` / `password_confirmation` field errors to the matching inputs; only real ticket field/detail/code restarts signup with the ticket message. No blanket “every 400 is invalid ticket”.
- Pure helpers + Node test runner: `src/features/auth/signupPassword.ts` + `signupPassword.test.ts` (`npm run test:auth-password`).

