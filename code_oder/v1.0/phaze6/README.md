# Phase 6 — Wallet and 5-Token Pricebook-Line UX

Status: **completed** (awaiting review)  
Date: 2026-07-28  
Authority: `FRONTEND_PHASE_06_INSTRUCTIONS.md`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)

## Goal

Integrate wallet visibility and charged calculation operations for cost reports, without moving billing authority to the client.

Current policy (after 2026-07-30 correction): explicit paid `محاسبه`, receipt-based Add, company wallet donation. The original Phase 6 fixed 5-token line-create UX is obsolete.

## Delivered

- Token wallet balance view (`GET /api/token-wallet/`) on the account settings page
- Token ledger view (`GET /api/token-wallet/transactions/`, newest-first) with type labels, signed amounts, and `balance_after`
- Client `idempotency_key` on every official pricebook-backed line create; key reused for retries of the same payload, regenerated on payload change or `IDEMPOTENCY_KEY_REUSED`
- Idempotent replay (HTTP 200 + `Idempotent-Replayed: true`) treated as success with a "no second charge" toast
- Fixed 5-token cost shown in the item-detail modal before adding a line (UI copy only; cost never sent to the backend)
- 402 `INSUFFICIENT_TOKEN_BALANCE` shows `required_tokens` vs `available_tokens` with admin top-up hint (single and bulk create)
- Wallet balance/transactions cache refreshed after successful line creates (single and bulk)
- No-charge flows (starred lines, calculate, edit, delete, recalculate, preview, export) unchanged and never presented as billable
- Phase 1–5 behavior preserved; no subscriptions, quota UX, or payment UI

## Reports

| File | Role |
| --- | --- |
| `REPORT.md` | Implementation detail |
| `TEST_RESULTS.md` | Commands and results |
| `USER_ACTIONS_REQUIRED.md` | Manual verification / blockers |
| `FRONTEND_PHASE_06_INSTRUCTIONS.md` | Phase authority |
