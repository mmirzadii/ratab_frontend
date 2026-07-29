# Phase 3 User Actions Required — Member Roles & Permissions

## Full permission catalogs (synced 2026-07-29)

Authority: backend `apps/companies/permissions_catalog.py` + live
`GET/PATCH /api/company-members/{id}/settings/`.

Frontend renders **all** rows from `configurable_permissions` (no single-key
subset). Admin does **not** re-edit inherited Employee switches.

Ownership-transfer UI in the member pane remains optional
(`OWNERSHIP_TRANSFER_SUPPORTED = false` until the dedicated flow is wired in this page).

## Live QA

1. Employee → section **اختیارات کارمند** with the full configurable Switch list.
2. Admin → inherited Employee note + **اختیارات مدیر** only.
3. Promote/demote warnings update the Switch catalog immediately.
4. Save uses `permission_settings` for the draft role only.
