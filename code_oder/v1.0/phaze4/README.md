# Phase 4 — Persistent Group Messaging

Status: **completed** (awaiting review)  
Date: 2026-07-28  
Authority: `FRONTEND_PHASE_04_INSTRUCTIONS.md`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)

## Goal

Replace local-only company messages with Backend v1 persisted group messages.

## Delivered

- Group selection + `GET|POST /api/company-groups/{group_id}/messages/`
- History bootstrap (latest page), earlier-page loading, send, reload/retry
- Empty / loading / forbidden / quota-exceeded handling
- Local-only message state and fake local attachments removed
- Attachment open/upload left for Phase 5 (compatibility placeholder only)
- Phase 1–3 auth, members, roles, groups, projects preserved

## Reports

| File | Role |
| --- | --- |
| `REPORT.md` | Implementation detail |
| `TEST_RESULTS.md` | Commands and results |
| `USER_ACTIONS_REQUIRED.md` | Manual verification / blockers |
| `FRONTEND_PHASE_04_INSTRUCTIONS.md` | Phase authority |
