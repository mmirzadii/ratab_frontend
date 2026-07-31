# Phase 10 Test Results

Date: 2026-07-31

## Commands run

| Command | Result |
| --- | --- |
| `npm run generate:api` | Pass |
| `npm run validate:docs` | Pass (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| `npx tsc -b` | Pass |
| `npm run lint` | Pass |
| `npm run test:message-lifecycle` | Pass — 15/15 |
| `npm run test:composer-textarea` | Pass — 11/11 (aria-label assertion updated for edit-mode label) |
| `npm run test:company-groups` | Pass — 52/52 |
| `npm run test:membership-access` | Pass — 11/11 |
| `npm run test:text-cleanup` | Pass — 26/26 |
| `npm run build` | Pass |

## Focused Phase 10 coverage (`messageLifecycle.test.ts`)

Helpers:

- distinct `client_message_id` values
- optimistic ↔ server merge without duplicate bubbles
- tombstone replace hides attachments
- viewport menu clamping
- capability-gated actions
- forwarded `label_fa` rendering

Wiring (source assertions):

- no `پیام ارسال شد.` toast
- pending / sent+single check / failed retry; no `CheckCheck` / read receipt
- edit via composer banner + draft backup + `ویرایش‌شده`
- delete confirmation + tombstone copy
- forward modal searchable groups + documented fields
- no local role hierarchy reconstruction

## Live verification

Dev server: `http://localhost:1000/` (active).

Browser session at verification time was **logged out** (landing / ورود-ثبت‌نام only). Full interactive desktop right-click and mobile long-press against a live conversation therefore **could not be completed in this agent session**.

Code-level wiring for both entry points is present and covered by tests:

- `onContextMenu` + `MessageActionsMenu`
- `LONG_PRESS_MS` long-press + overflow button

**Manual follow-up after login** (see `USER_ACTIONS_REQUIRED.md`):

1. Desktop: right-click own/other messages → confirm menu items match `can_*`.
2. Mobile/narrow: long-press / overflow → same actions.
3. Send → pending then single check; no success toast.
4. Edit / delete / forward happy paths.

## Notes

- OpenAPI `attachments` method field was corrected after spectacular exported it as `string`; regenerated types again after the fix.
- No backend application code was modified.
- Results are not fabricated; live UI paths requiring auth remain pending manual confirmation.
