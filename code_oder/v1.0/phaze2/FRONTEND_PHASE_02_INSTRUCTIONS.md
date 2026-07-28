# Phase 2 — Session Authentication, Signup, Login, and CSRF

Read the common rules, current backend auth documents/OpenAPI, Phase 1 reports, and the existing auth implementation.

## Goal

Migrate the browser authentication flow from the v0 development-token approach to the current v1 session-cookie contract.

## Work

- Implement the backend-defined signup flow: phone, local verification code, password creation, then authenticated session.
- Implement phone/password login, current-session bootstrap, session restore, expiry handling, and backend logout.
- Update the shared API layer for cookies and CSRF according to the backend contract.
- Update protected-route and auth state behavior without rewriting unrelated application structure.
- Remove or isolate obsolete token/sessionStorage behavior only after the new flow works.
- Keep local any-code verification clearly development-only and do not simulate real SMS.

Run focused auth checks plus the normal frontend validation commands, update `phaze2/` reports, and stop.
