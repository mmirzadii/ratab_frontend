# Phase 10 Report — Messenger-Like Message Status, Edit, Delete, and Forward

Date: 2026-07-31  
Contract: synced `backend_docs/current/` from backend `codexphaze/frontend_docs/` (OpenAPI regenerated from running backend, then attachments/`ForwardedFrom` corrected for spectacular SerializerMethodField defaults)

## Goal delivered

Upgrade persistent group chat with a messenger-like lifecycle while preserving Phase 9 workspace UX, attachments, quotas, RTL, and themes.

## Contract sync

1. Exported OpenAPI from `ratab_backend-backend-1` via `manage.py spectacular`.
2. Copied into backend `codexphaze/frontend_docs/` and frontend `backend_docs/current/`.
3. Synced accompanying handoff docs (`FRONTEND_HANDOFF.md`, examples, permissions, etc.).
4. Corrected `GroupMessage.attachments` back to `MessageAttachment[]` and typed `forwarded_from` as `ForwardedFrom` (spectacular had defaulted the method field to string).
5. Ran `npm run generate:api`.

Backend endpoints used (no backend source changes):

| Action | Method / path |
| --- | --- |
| Create | `POST /api/company-groups/{group_id}/messages/` (+ optional `client_message_id`) |
| Edit | `PATCH /api/group-messages/{message_id}/` `{ text }` |
| Soft-delete | `DELETE /api/group-messages/{message_id}/` → tombstone |
| Forward | `POST /api/group-messages/{message_id}/forward/` `{ target_group_id, client_message_id? }` |

Capability fields trusted from responses: `can_edit`, `can_delete`, `can_forward`.

## Sending status

- Removed toast `پیام ارسال شد.`
- Optimistic outgoing bubble with `client_message_id` + temp id
- pending: clock + spinner
- sent: compact server time + **one** check (persistence only; no double-check/read receipt)
- failed: retry control reuses the same idempotency id so retries do not duplicate bubbles
- Reconciliation merges by `client_message_id`

## Desktop / mobile actions

Shared `MessageActionsMenu`:

- Desktop: `onContextMenu` (native menu suppressed only on messages)
- Mobile/touch: long-press (~480ms) + compact overflow button
- Closes on outside click, Escape, group change, and message-list scroll
- Viewport-clamped positioning (`clampMenuPosition`)

Menu items only when backend capabilities allow:

- ویرایش
- حذف
- بازارسال

## Edit

Composer edit mode (not a centered modal):

- banner with preview + انصراف
- loads message text; attachments unchanged / not replaceable
- preserves and restores unsent normal draft (`draftBackup`)
- `PATCH` update; shows `ویرایش‌شده`; no success toast
- failure keeps edit mode and text with Persian error

## Delete

`DeleteMessageConfirm` sheet → soft-delete API → replace bubble with backend tombstone (`پیام حذف شد`, empty attachments). No success toast. Surrounding messages/scroll preserved.

## Forward

`ForwardMessageModal`:

- eligible active same-company groups from existing membership-scoped list (**including the current/source group**; same-group forward is valid)
- search + single selection + kind labels; current group marked `گفتگوی فعلی` (informational only)
- compact source preview: real message text, else attachment filename / financial-document title (no `پیام با پیوست` / no `۱ پیوست` for a single attachment)
- submits only `target_group_id` + `client_message_id`
- duplicate-submit blocked while pending
- success closes modal; same-group success appends the new forwarded message locally; other targets refresh activity via RTK tags; current chat stays open
- Persian-only forward errors via `formatForwardError` (never the obsolete English same-group message)

## Primary files

- `src/features/companies/companyMessagesApi.ts` — create/update/delete/forward mutations
- `src/features/companies/chatMessageHelpers.ts` — optimistic merge / client ids / labels
- `src/features/companies/messageMenuPosition.ts`
- `src/features/companies/MessageActionsMenu.tsx`
- `src/features/companies/DeleteMessageConfirm.tsx`
- `src/features/companies/ForwardMessageModal.tsx`
- `src/features/companies/forwardMessageHelpers.ts`
- `src/features/companies/forwardMessage.test.ts`
- `src/features/companies/MessagesSection.tsx`
- `backend_docs/current/OPENAPI.yaml` (+ synced handoff package)

## Cleanup

- Removed send-success toast branch
- No local Owner/Manager/Employee permission reconstruction
- No browser-native context menu dependency for actions
- Shared action model for desktop/mobile
- Edit/delete do not invalidate conversation ordering; forward does for the target group
- Forward correction: same-group allowed; compact real-title preview; Persian-only forward errors

## Out of scope (intentionally not added)

Read receipts, double-check, reactions, replies, voice, fake realtime, cross-company forward UI, attachment replacement on edit, hard delete.

## Related correction (2026-07-31) — Group Info panel

Telegram-style Group Info internal views (overview / edit / addMembers) remain separate from message lifecycle. Permission gating for custom-group edit/invite now respects Admin `can_manage_all_custom_groups` from `effective_permissions`. Messaging Phase 10 behavior was not changed by this correction.
