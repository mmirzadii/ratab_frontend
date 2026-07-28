# Phase 3 — User Actions Required

## Required for full multi-role verification

1. Use a Backend v1.0 instance with session auth + CSRF already trusted for the Vite origin (Phase 2 local note: include `http://localhost:1000` in `CSRF_TRUSTED_ORIGINS` / `CORS_ALLOWED_ORIGINS` when Vite runs on port 1000).
2. Manually verify owner / admin / employee paths listed in `TEST_RESULTS.md` against real users and memberships.
3. Confirm adding a member requires that phone number to already exist as a backend user (per backend signup/login contract); the frontend does not invent invite/signup-on-add flows.

## Not required for code merge of Phase 3 frontend work

- No frontend secrets or env keys were added for Phase 3.
- No backend code changes are required for the frontend compile/lint/build path.
- No commit or push was made by the agent.

## Blockers

No hard frontend blocker for Phase 3 compile/lint/build.

Optional product/process gap: no automated frontend test suite yet, so role UX regressions rely on manual QA until a later phase adds tests.
