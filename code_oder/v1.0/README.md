# Ratab Frontend v1.0 Upgrade Phases

This directory contains the frontend upgrade plan from v0.0 to v1.0.

Rules:

- Run phases in order.
- Keep the existing frontend and extend it; do not rebuild the project from scratch.
- Use `backend_docs/current/` as the active backend contract.
- Keep every phase instruction, report, test result, and required user action inside the same `phazeN/` folder.
- Do not create separate numbered output folders.
- Stop after each phase for review.

Phase order:

1. v1 baseline and backend contract sync — **completed 2026-07-28**
2. session authentication, signup, login, and CSRF — **completed 2026-07-28**
3. company members, roles, and groups
4. persistent group messaging
5. private files and attachments
6. wallet and 5-token line-charge UX
7. subscriptions, quota, and disabled payment UX
8. final integration, regression, cleanup, and handoff

## Current baseline (after Phase 2)

- Frontend active version: `code_oder/active_version.txt` = `v1.0`
- Backend contract: `backend_docs/current/BACKEND_VERSION` = `v1.0`
- OpenAPI generation: `backend_docs/current/OPENAPI.yaml` → `src/shared/api/generated/schema.ts`
- Browser auth: session cookies + CSRF (signup/login/logout/restore)
- Still pending: members/groups, messaging, files, wallet, subscriptions

See `PROJECT_EXPLAIN.md`, `phaze1/REPORT.md`, and `phaze2/REPORT.md` for details.
