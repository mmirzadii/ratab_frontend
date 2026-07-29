# Phase 4 — User Actions Required

## Required for full messaging verification

1. Use Backend v1.0 with session auth + CSRF trusted for the Vite origin (Phase 2 note: include `http://localhost:1000` when Vite uses port 1000).
2. Ensure test users are **active members** of the target group before expecting message list/send success.
3. Manually run the checklist in `TEST_RESULTS.md` (send, reload persistence, pagination, forbidden non-member, optional quota 429).

## Not required for Phase 4 frontend compile/lint/build

- No new frontend env secrets.
- No backend code changes for the frontend build path.
- No commit/push was made by the agent.

## Blockers

No hard frontend blocker for Phase 4 compile/lint/build.

Optional gaps:

- No automated frontend test suite yet.
- Full message-quota status UI remains Phase 7; only send-time `MESSAGE_QUOTA_EXCEEDED` handling is in Phase 4.
- Attachment upload/open remains Phase 5.

---

## Post-v1 — membership gate QA

After the message-access correction, manually verify:

1. Company admin/owner who is **not** in a group: Messages shows Persian membership-required empty state; network tab should **not** spam message list requests.
2. After being added to the group via `POST .../members/` (direct activation): messages load without logout.
3. English detail `Active membership in this group is required.` never appears in the UI.
4. Link “رفتن به بخش گروه‌ها” focuses the groups section.

Invitation accept → message unlock still requires backend invitation endpoints (see Phase 3 `USER_ACTIONS_REQUIRED.md`).

