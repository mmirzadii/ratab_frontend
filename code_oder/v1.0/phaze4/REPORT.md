# Phase 4 Report — Persistent Group Messaging

Date: 2026-07-28  
Frontend active version: `v1.0`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)  
Primary authority: `code_oder/v1.0/phaze4/FRONTEND_PHASE_04_INSTRUCTIONS.md`

## Understanding

Replace the dashboard’s local React message list with backend-persisted **group** messages. Messaging requires active **group membership** (stricter than company admin). Phase 5 owns file/financial-document attachment upload and open flows.

## Contract sources used

- `OPENAPI.yaml` — `GroupMessage`, `GroupMessageCreateRequest`, `PaginatedGroupMessage`, `MessageQuotaExceeded`
- `FRONTEND_HANDOFF.md` — page size 50, `?page=`, text and/or attachments payload, membership rule, 429 quota UX
- `PERMISSIONS.md` — list/create messages only for active group members
- `ERROR_CODES.md` — `MESSAGE_QUOTA_EXCEEDED`
- Generated `schema.ts` (not hand-edited)

## Implementation

### New modules

| File | Responsibility |
| --- | --- |
| `src/features/companies/companyMessagesApi.ts` | RTK Query list/create + quota helpers |
| `src/features/companies/MessagesSection.tsx` | Group picker, history, send, states |

### Shared tags

`baseApi` tag type added: `GroupMessage`.

### Endpoints wired

- `GET /api/company-groups/{group_id}/messages/` (optional `?page=`)
- `POST /api/company-groups/{group_id}/messages/` with `{ text }` only

### UI behavior

- Messages section lists company groups (backend-filtered for employees; admin/owner may see all).
- Selecting a group loads page 1 for `count`, then the **latest** page for chat bootstrap.
- “بارگذاری پیام‌های قبلی” loads the previous page and prepends (scroll anchored).
- Send appends the created `GroupMessage` from the 201 response (persists across reload via refetch).
- Loading / empty / forbidden (403) / retry covered.
- On `429 MESSAGE_QUOTA_EXCEEDED`: disable send and show `resets_at` (no full subscription UX — Phase 7).
- Received `attachments[]` shown as a non-interactive Phase 5 placeholder only.
- Guided-tour `data-tour="add-attachment-btn"` retained as a link to the cost-report wizard (no fake local attach).

### Removed local-only workarounds

- `LocalMessage` / pending local attachment send path removed from `CompanyDashboardPage`.
- Wizard back navigation now uses `focusSection: "costReports"` instead of `pendingCostReportAttachment`.
- Legacy `pendingCostReportAttachment` route state still cleared with an info toast if encountered.

## Preserved Phase 1–3 behavior

- Session cookies + CSRF unchanged
- Members / roles / groups management unchanged
- Projects / cost reports / pricebooks / coefficients unchanged
- Shell, RTL, theme patterns preserved

## Intentionally out of scope

- Private file upload/management
- Message file attachments create/open
- Financial-document attachments create/open
- Wallet / 5-token UX
- Subscription / message-quota status screens
- Payments

## Contract notes / mismatches

1. OpenAPI `company_groups_messages_retrieve` lists **no** `page` query parameter, while `FRONTEND_HANDOFF.md` requires page-number pagination (`?page=`, size 50) and `PaginatedGroupMessage` includes `next`/`previous`. Frontend follows the handoff and sends `page` when `> 1`. Documented here; did not invent a different pagination scheme.
2. OpenAPI still lists `tokenAuth` beside `cookieAuth`; frontend continues Phase 2 cookie + CSRF only.
3. Create examples often send `attachments: []`; frontend sends text-only body (`{ text }`), which matches optional schema fields.
4. No automated messaging/routing test suite exists in this repo.

## Risks / remaining limitations

- Company admin/owner who is **not** a group member will see the group in the list (backend list rule) but message load/send will fail with access denial until they join — UI shows error + retry.
- Full quota dashboard (`GET /api/message-quota/`) deferred to Phase 7; only send-time 429 handling is present.
- Live multi-group messaging QA still needs a running Backend v1 session.

## Stop point

Phase 4 complete for review. Phase 5 not started. No commit/push performed.
