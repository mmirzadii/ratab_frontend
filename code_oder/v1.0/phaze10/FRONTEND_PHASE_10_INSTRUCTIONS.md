# Phase 10 — Messenger-Like Message Status, Edit, Delete, and Forward

## Purpose

Upgrade the existing Ratab persistent chat experience with a clean message lifecycle while preserving all approved v1 workspace, theme, attachment, group, quota, and permission behavior.

This phase adds:

- timestamp and server-confirmed sent status inside each outgoing message;
- no success toast for normal message sending;
- editing of the sender's own messages;
- role-aware deletion based on backend capabilities;
- desktop right-click and mobile touch actions;
- forwarding one message to one eligible group through a focused modal.

Do not add unsupported read receipts, reactions, replies, voice messages, or fake realtime behavior.

## Read before changing code

Read in order:

1. `AI_CODE_PRINCIPLES.md`
2. `code_oder/COMMON_FRONTEND_CODEX_RULES.md`
3. `code_oder/v1.0/COMMON_FRONTEND_CODEX_RULES.md`
4. `code_oder/active_version.txt`
5. `code_oder/v1.0/PROJECT_EXPLAIN.md`
6. all completed v1 reports, especially messaging, roles, permissions, attachments, quotas, and Phase 9 workspace UX
7. every synchronized file under `backend_docs/current/`
8. the current message API, RTK Query cache, message bubble, composer, attachment cards, group list, modal/sheet, and responsive code
9. this Phase 10 instruction file.

Run API generation before implementation. Backend-generated capability fields and OpenAPI are the authority.

## Sending feedback

Remove the top success toast such as:

`پیام ارسال شد.`

Normal send success must be communicated inside the outgoing message bubble.

Use these states:

- pending: compact clock/spinner while the request is in flight;
- sent: server timestamp plus one check after persistence succeeds;
- failed: clear failure icon/state with a deliberate retry action.

Do not show a double check unless the backend later supplies genuine read/delivery receipts. One check means persisted by the server, not read by recipients.

Use an optimistic temporary message only when it can be safely reconciled through the backend client/idempotency ID.

On success, replace the temporary message with the authoritative response without duplicate bubbles.

On failure, preserve text and attachments and allow retry without creating a duplicate.

## Message metadata

Show message time compactly inside or beside the bubble.

For edited messages, show a subtle `ویرایش‌شده` marker.

Deleted messages render as a neutral tombstone such as `پیام حذف شد`; do not show old body or attachment cards.

Forwarded messages show a restrained forwarded-source header from backend data.

## Action entry points

### Desktop

Right-clicking a message opens a custom context menu beside the message.

The menu must:

- be positioned within the viewport;
- close on outside click, Escape, route/group change, and relevant scroll;
- suppress the browser's native context menu only for message actions;
- support keyboard focus and activation.

### Mobile and touch

Use long-press and/or a compact accessible overflow action on the message.

Do not depend on right-click on mobile.

Do not create two separate feature implementations; share one action model and menu content.

## Backend-derived actions

Render menu items from backend capability fields such as:

- `can_edit`;
- `can_delete`;
- `can_forward`.

Do not duplicate the role hierarchy in React.

Expected menu items:

- `ویرایش`
- `حذف`
- `بازارسال`

A user sees only permitted actions.

## Edit flow

Only the sender may edit their own message according to the backend capability.

Selecting `ویرایش` should use the existing composer area rather than a centered modal.

Recommended behavior:

- composer enters an explicit edit mode;
- show a compact edit banner containing message preview and `انصراف`;
- load editable text/caption into the textarea;
- preserve any unsent normal draft and restore it after save/cancel;
- attachments remain unchanged and are not replaceable through text edit;
- submit through the documented update endpoint;
- on success, update the bubble and show `ویرایش‌شده`;
- no success toast;
- on failure, keep edit mode and text with a concise Persian error.

Editing must not move the conversation, create a duplicate message, or reset chat scroll.

## Delete flow

Selecting `حذف` opens a compact confirmation dialog/sheet.

Use backend `can_delete`; never infer permission locally.

On success:

- replace the bubble with the backend tombstone;
- do not remove surrounding messages or jump scroll;
- do not show a normal success toast;
- invalidate/refetch only the required message/group data.

On failure, keep the original message and show a concise Persian error.

Do not offer local-only delete in this phase.

## Forward flow

Selecting `بازارسال` opens one responsive modal/sheet.

The modal must list eligible target groups returned by or consistent with the backend contract:

- active groups in the same company;
- only groups where the current user has active membership;
- clear public/project/custom labels where supported;
- searchable when useful;
- one target group selected per forwarding operation.

Show the source message preview, selected target, confirm, and cancel.

Do not expose inaccessible or cross-company groups.

On confirm:

- send only the documented target group and idempotency fields;
- prevent duplicate clicks;
- wait for the server result;
- close the modal on success;
- refresh the target conversation list/activity order;
- keep the current chat open unless the user explicitly chooses to open the target;
- do not duplicate attachment bytes or fabricate attachment access.

If an attachment cannot be forwarded, show the backend error and preserve the modal selection.

## Message permissions

Expected product behavior is enforced by Backend capabilities:

- everyone edits only their own messages;
- Employee deletes only their own messages;
- Owner may delete any normal member message;
- Manager deletes their own and may delete Employee messages only when their configured permission allows it;
- Manager may not delete Owner/Manager messages through employee moderation;
- forwarding is available only for readable, non-deleted messages and eligible targets.

The frontend must not hardcode these rules beyond tests that verify capability rendering.

## Attachments

Preserve existing private-file and financial-document cards.

Message edit does not replace attachments.

A deleted message hides its attachment cards.

A forwarded message renders the backend-authorized forwarded attachment references.

Existing behaviors remain:

- financial-document card body opens the Ratab document;
- PDF/file actions remain separate;
- private URLs are never constructed from raw IDs.

## Composer and drafts

Preserve the approved auto-growing composer.

Normal send mode and edit mode must be clearly distinct.

Sending/editing must respect:

- Enter/Shift+Enter behavior already approved;
- IME composition;
- duplicate-submit prevention;
- attachment pending state;
- failed-send retry;
- mobile virtual keyboard and safe-area behavior.

Do not lose an unsent draft when opening a context menu, forwarding, or editing another message.

## State and cache

Keep API state in RTK Query.

Use stable optimistic IDs only when supported by the backend idempotency contract.

Avoid:

- duplicate bubbles after reconciliation;
- full chat refetch for every small action when a targeted cache update is safe;
- stale capability fields after role/permission changes;
- context menus referring to a message after group switching;
- reorder loops.

Edit and delete must not reorder groups. A forwarded message is a new target-group activity and should refresh ordering.

## Errors and accessibility

Never render raw HTML, JSON, stack traces, or English backend errors.

Provide accessible names, focus handling, keyboard navigation, and touch targets.

Context menu, confirmation dialog, and forward modal must be viewport-bounded in desktop and mobile layouts.

## Cleanup

Remove obsolete code where proven unused, including:

- send-success toast branches;
- duplicate local sent-state logic;
- browser-native context-menu dependency;
- duplicated desktop/mobile action implementations;
- local role-based permission reconstruction;
- hard-delete-only UI assumptions;
- stale menu/modal state and imports.

Preserve unrelated accepted workspace and cost-report work.

## Validation

Add/update tests covering:

### Sending

- pending indicator;
- server timestamp and single check on success;
- no success toast;
- failure/retry without duplicate message;
- no fake double check/read receipt.

### Menu and permissions

- desktop right-click opens the custom menu;
- mobile long-press/overflow opens the same actions;
- menu stays inside viewport and closes correctly;
- backend capabilities control visible actions.

### Edit

- own message enters composer edit mode;
- normal draft is preserved/restored;
- success updates bubble and edited marker;
- another user's edit is not offered;
- attachments remain unchanged;
- failure preserves edit text.

### Delete

- confirmation is required;
- success renders tombstone;
- unauthorized delete action is absent;
- failed deletion preserves the message;
- list/order/scroll remain stable.

### Forward

- modal lists only eligible same-company groups;
- search and single selection work;
- request uses documented fields;
- duplicate submit is blocked;
- success refreshes target activity without leaving current chat;
- attachment-forwarding errors remain visible;
- deleted messages cannot be forwarded.

### Regression

- messaging pagination and refresh remain correct;
- file and financial-document attachments still work;
- quota errors remain correct;
- public/project/custom group behavior remains correct;
- dark/light themes and RTL/mobile layouts remain correct.

Run and record:

- `npm run generate:api`
- `npm run validate:docs`
- TypeScript check
- `npm run lint`
- focused Phase 10 message tests
- available frontend tests
- `npm run build`
- live desktop and mobile verification.

## Documentation and phase outputs

Keep all Phase 10 files inside:

```text
code_oder/v1.0/phaze10/
```

Update:

- `code_oder/v1.0/PROJECT_EXPLAIN.md`
- `code_oder/v1.0/README.md`
- `code_oder/v1.0/FRONTEND_PHASES_SUMMARY.md`
- `code_oder/v1.0/phaze10/README.md`
- `REPORT.md`
- `TEST_RESULTS.md`
- `USER_ACTIONS_REQUIRED.md`

Do not create another numbered output folder.

Stop after Phase 10 Frontend and wait for review.
