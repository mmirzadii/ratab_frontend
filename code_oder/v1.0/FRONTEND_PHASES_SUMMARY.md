# Frontend v1.0 Phase Summary

| Phase | Scope |
|---|---|
| 1 | Create the v1 baseline, verify the copied backend contract, regenerate API types, and document the existing frontend before functional changes. |
| 2 | Replace the v0 dev-token browser flow with the v1 session-cookie signup/login/logout/restore and CSRF flow. |
| 3 | Add frontend integration for company members, roles, permissions, and groups while preserving existing company/project behavior. |
| 4 | Replace local-only company messages with backend-persisted group messaging. |
| 5 | Add private file upload/opening and file/financial-document message attachments. |
| 6 | Add wallet visibility and idempotent charged operations. Historical note: the original Phase 6 UI assumed a fixed 5-token official line create; that UX was replaced on 2026-07-30 by calculation-based billing (explicit `محاسبه`, receipts, company wallet). |
| 7 | Add subscription and daily message-quota states and a clear disabled-payment experience. |
| 8 | Re-sync with the final backend contract, remove obsolete compatibility code, run regression checks, and finalize v1 documentation. |
| 9 | Conversation-first company workspace: remove permanent Projects/Groups nav; ordered conversation list; create menu; composer **افزودن** (فایل \| صورت‌بها); list-first financial-document selector; empty-chat/drawer **افزودن صورت‌بها**; group drawer tabs صورت‌بهاها / فایل‌ها / لینک‌ها / اعضا — without inventing backend features. |
| 10 | Messenger-like message lifecycle: in-bubble pending/sent/failed status (single check = server persistence); no send-success toast; desktop right-click + mobile long-press actions; composer edit; soft-delete tombstone; same-company forward modal; actions gated by backend `can_edit` / `can_delete` / `can_forward`. |
| 11 | Separate pricebook family and year: Document Info `نوع فهرست‌بها` (`title_fa`) + `سال` (edition years newest-first); submit exact Edition ID; existing documents read-only; no ABN1404 / hardcoded 1404 authority. |
