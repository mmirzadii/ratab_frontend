# Phase 10 Test Results

Date: 2026-07-31

## Commands run

| Command | Result |
| --- | --- |
| `npm run generate:api` | Pass |
| `npm run validate:docs` | Pass (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| `npx tsc -b` | Pass |
| Focused ESLint on changed forward files | Pass |
| `npm run test:message-lifecycle` | Pass — 15/15 |
| `npm run test:forward-message` | Pass — 15/15 |
| `npm run test:composer-textarea` | Pass — 11/11 |
| `npm run build` | Pass |

## Focused Phase 10 coverage (`messageLifecycle.test.ts`)

- no send-success toast; pending / sent+single check / failed retry
- edit via composer; delete tombstone; capability-gated actions
- forward modal searchable; current group labeled; no generic `پیام با پیوست`

## Forward correction (`forwardMessage.test.ts`) — 2026-07-31

- Current group remains in the target list, selectable, labeled `گفتگوی فعلی`
- Same-group success appends the created message and closes the modal without navigation
- Preview uses real text / filename / financial-document title; no `پیام با پیوست`; no `۱ پیوست` for a single attachment
- Obsolete English same-group error is mapped away; inaccessible/generic English → Persian
- Duplicate submit blocked while pending; modal stays viewport-bounded

## Notes

- No backend application code was modified.
- No commit/push.
- Results are not fabricated.

## Related (2026-07-31) Group Info refinement regression

| Command | Result |
| --- | --- |
| `npm run test:company-groups` | Pass — 58/58 (includes Group Info + `canManageGroup`) |
| `npm run test:company-permissions` | Pass — 12/12 |
| `npm run test:membership-access` | Pass — 11/11 |
| `npm run test:message-lifecycle` | Pass — 15/15 |
| `npm run test:forward-message` | Pass — 15/15 |
| `npm run build` | Pass |
