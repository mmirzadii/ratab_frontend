# Frontend Phase 3 Report

## Summary

Status: done.

Phase 3 added phone-based dev auth UI, RTK Query auth endpoints, session-scoped token storage, automatic `Authorization: Token <token>` headers, `auth/me` session validation, logout, and protected application routes.

The backend contract does not support password or OTP login in v0.0, so no password/secret step was faked. The UI clearly reports that the current supported behavior is dev-login only.

## Scope

- Implemented only Phase 3 auth and protected shell behavior.
- Used `POST /api/auth/dev-login/` and `GET /api/auth/me/` from the backend contract.
- Kept the public `/status` health route.
- Protected `/` behind token auth and `auth/me` verification.
- Did not implement company list/create APIs, projects, pricebooks, financial documents, or production deployment.

## Files Created

- `src/features/auth/authApi.ts`
- `src/features/auth/authSlice.ts`
- `src/features/auth/RequireAuth.tsx`
- `src/features/auth/tokenStorage.ts`
- `src/pages/LoginPage.tsx`
- `code_oder/v0.0/phaze3/REPORT.md`
- `code_oder/v0.0/phaze3/TEST_RESULTS.md`

## Files Modified

- `src/app/router.tsx`
- `src/app/store.ts`
- `src/pages/DashboardPreviewPage.tsx`
- `src/shared/api/baseApi.ts`
- `src/shared/components/TopHeader.tsx`

## Implementation Details

- Added a public `/login` route with a two-step Persian phone-first dev auth UI.
- Normalizes Persian/Arabic digits in phone input before API submission.
- Uses generated OpenAPI types for `DevLoginRequest`, `DevLoginResponse`, and `AppUser`.
- Stores the dev token in `sessionStorage`, not `localStorage`, to match the handoff’s dev-session guidance.
- Adds `Authorization: Token <token>` in RTK Query `prepareHeaders` when a session token exists.
- Adds `RequireAuth` to protect the root app shell and validate existing sessions with `GET /api/auth/me/`.
- Clears token/user state and RTK Query cache on logout.
- Highlights the future "create company" CTA after a newly created dev-login response, without calling company APIs.

## UI/UX Notes

- UI remains Persian-first and RTL.
- Login uses the existing dark glassmorphism visual language and theme toggle.
- Password/OTP fields are intentionally absent because the backend contract only supports dev-login.
- Protected dashboard copy states that company/project/financial behavior is future-phase work.
- Header shows current user identity when authenticated and exposes logout.

## API Contract Notes

- Used `backend_docs/history/v0.0/frontend_handoff_v0_0.md`.
- Used generated types from `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`.
- The prompt-required exact schema filename `backend_docs/history/v0.0/OPENAPI.yaml` is still absent.
- Supported auth endpoints:
  - `POST /api/auth/dev-login/`
  - `GET /api/auth/me/`
- Backend mismatch documented: desired password/secret UX is not supported by the v0.0 backend; frontend uses dev-login only and does not fake password security.

## Docker / Online Dev Deployment Notes

Docker files were not changed in Phase 3.

Because `docker/frontend/Dockerfile`, `docker/frontend/nginx.conf`, and `.dockerignore` were unchanged, Docker build was not required for this phase.

## Issues and Findings

- No frontend test runner or test files are configured yet.
- The exact spaced OpenAPI schema filename requested by the wrapper prompt is absent.
- Manual dev-login was not executed during verification to avoid creating/reusing a backend user as a side effect.

## Risks and Assumptions

- Assumed `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` remains the authoritative schema source.
- Assumed sessionStorage is the safest available browser storage for temporary dev tokens in this phase.
- If `ENABLE_DEV_LOGIN=false` on the backend, the login endpoint returns `404` and the UI shows a Persian error.
- The create-company highlight is UI-only and intentionally waits for Phase 4 APIs.

## User Actions Required

- Manually test `/login` against the dev backend with a disposable phone number.
- Review that `/` redirects unauthenticated users to `/login`.
- Review logout behavior and confirm the token is removed from the current browser session.
- Confirm whether the OpenAPI schema should remain `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` or be manually copied/renamed to `backend_docs/history/v0.0/OPENAPI.yaml`.

## Suggested Commit Message

feat(frontend-phase3): add phone login and protected app shell

## Next Step

After manual auth review, proceed only with frontend Phase 4 for company list/create and the company dashboard shell.
