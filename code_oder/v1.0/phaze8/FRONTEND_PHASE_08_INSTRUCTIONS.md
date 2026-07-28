# Phase 8 — Final Integration, Regression, Cleanup, and Handoff

Read the common rules, every completed v1 phase report, the final backend contract, and the current frontend implementation.

## Goal

Finalize the v1 frontend without adding a new product feature.

## Work

- Regenerate API types from the final current OpenAPI contract and resolve remaining contract mismatches.
- Verify the complete v1 flow end to end: auth, companies, members, groups, messages, private files, attachments, wallet, 5-token line creation, subscription, quota, and disabled payment.
- Re-run the important v0 flows and preserve their behavior.
- Remove obsolete dev-token, local-message, temporary attachment, and compatibility code only when proven unused.
- Verify API base settings, cookie/CSRF behavior, route refresh, production build, responsive RTL layouts, themes, accessibility, loading/error states, and long content handling.
- Finalize `PROJECT_EXPLAIN.md`, version README, known limitations, integration notes, and rollback guidance.
- Record anything not tested as `Not run`; do not claim production readiness without evidence.

Run the full available frontend validation/regression commands, update `phaze8/` reports, and stop for final review.
