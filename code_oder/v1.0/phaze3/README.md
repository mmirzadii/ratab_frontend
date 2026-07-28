# Phase 3 — Company Members, Roles, and Groups

Status: **completed** (awaiting review)  
Date: 2026-07-28  
Authority: `FRONTEND_PHASE_03_INSTRUCTIONS.md`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)

## Goal

Integrate Backend v1 company workspace members, roles, permissions, groups, and group membership into the existing company dashboard, with access-aware UX only (backend remains authoritative).

## Delivered

- RTK Query APIs for company members and groups (OpenAPI paths only)
- Permission helpers aligned to `PERMISSIONS.md`
- Members and Groups dashboard sections + navigation
- Read-only company info for employees
- Last-active-owner protection reflected in UX (still enforced by backend)
- Phase 1 contract baseline and Phase 2 session/CSRF auth preserved
- Messaging, files, wallet, subscriptions, payments intentionally not implemented

## Reports

| File | Role |
| --- | --- |
| `REPORT.md` | Implementation detail |
| `TEST_RESULTS.md` | Commands and results |
| `USER_ACTIONS_REQUIRED.md` | Manual verification / blockers |
| `FRONTEND_PHASE_03_INSTRUCTIONS.md` | Phase authority (unchanged intent) |
