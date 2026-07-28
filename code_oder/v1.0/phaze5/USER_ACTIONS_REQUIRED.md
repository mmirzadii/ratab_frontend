# Phase 5 — User Actions Required

## Required for full file/attachment verification

1. Backend v1.0 with session auth + CSRF trusted for the Vite origin, and **private storage configured/available**.
2. Use an account that is an **active member** of the target group (attachment open requires group membership).
3. Manually run the checklist in `TEST_RESULTS.md` (upload, send, open, download, financial-document attach, unavailable/forbidden cases).

## Not required for Phase 5 frontend compile/lint/build

- No new frontend secrets or env vars.
- No backend code changes for the frontend build path.
- No commit/push was made by the agent.

## Blockers

No hard frontend blocker for Phase 5 compile/lint/build.

Optional gaps:

- No automated frontend test suite yet.
- No company-wide file list API in the contract, so there is no standalone file manager UI.
- Wallet / subscription / payment UX remain later phases.
