# Phase 7 — Subscription, Message Quota, and Disabled Payment UX

Status: **completed** (awaiting review)  
Date: 2026-07-28  
Authority: `FRONTEND_PHASE_07_INSTRUCTIONS.md`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)

## Goal

Expose subscription and daily message-quota state from the real API, keep `MESSAGE_QUOTA_EXCEEDED` as a stable product condition, and surface the disabled-payment boundary clearly — without fake checkout or client-side billing authority.

## Delivered

- Subscription status (`GET /api/subscription/`) and backend-owned plan list (`GET /api/subscription-plans/`) on `/settings`
- Daily message quota (`GET /api/message-quota/`) on settings and in the messages compose area
- Null daily limit shown as unlimited / unconfigured (no invented free-tier number)
- `MESSAGE_QUOTA_EXCEEDED` (429) disables send, shows `used_today` / `daily_limit` / `resets_at`, refreshes quota; soft UX unlock after remaining recovers
- Disabled-payment UX + `POST /api/payments/orders/` probe that handles `PAYMENTS_DISABLED` (503) in Persian; no bank redirect, card form, or fake success
- Unresolved plan/package seeding documented (not invented)
- Phase 1–6 behavior preserved

## Reports

| File | Role |
| --- | --- |
| `REPORT.md` | Implementation detail |
| `TEST_RESULTS.md` | Commands and results |
| `USER_ACTIONS_REQUIRED.md` | Manual verification / blockers |
| `FRONTEND_PHASE_07_INSTRUCTIONS.md` | Phase authority |
