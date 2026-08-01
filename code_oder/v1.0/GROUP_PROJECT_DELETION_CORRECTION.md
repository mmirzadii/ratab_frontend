# Frontend correction — group/project deletion & project settings

Date: 2026-07-31  
Scope: extend existing Telegram-like `GroupInfoDrawer` (no new settings page).  
Authority: synced Backend OpenAPI + `FRONTEND_HANDOFF.md` (hard deletion preview/confirm; project-group PATCH).

## Summary

- Group type from backend `group_kind` / `is_public` / `group_type` / `project_id` (not title/badge/list position).
- Public: no delete control.
- Ordinary custom: `حذف گروه` when `can_delete`; preview → confirm → `DELETE` with `confirmation`.
- Project group: `حذف پروژه`; strong Persian warning + backend counts; `DELETE /api/projects/{id}/`.
- Project edit: one form, one `PATCH /api/company-groups/{id}/` carrying project metadata; header/chat list refresh via RTK invalidation.
- After delete: close panel, select Public (or first remaining), clear chat draft/attachments, invalidate groups/projects/messages/financial documents.
- No optimistic remove; errors keep modal open.

## Validation

| Command | Result |
| --- | --- |
| `npm run generate:api` | pass |
| `npx tsc -b` | pass |
| `npm run test:company-groups` | pass — 74/74 (after pencil fix) |
| `npm run build` | pass |

## Limitations

- Soft archive (`POST .../deactivate/`) remains in the API client but is no longer the primary Group Info destructive UX (hard delete replaces it when `can_delete`).
- OpenAPI `PatchedCompanyGroupRequest` still lists only `name`/`description`; project fields are sent per handoff/examples via a widened request type.
- Company **list** endpoint still serializes `can_edit`/`can_delete` as false without actor context; Group Info therefore loads `GET /api/company-groups/{id}/` for authoritative capabilities and merges them into the list cache.

## 2026-07-31 follow-up — edit pencil regression

**Cause:** Chat-list groups from `GET /api/companies/{id}/groups/` are serialized without request/actor context → every row gets `can_edit: false`. After trusting list `can_edit`, `false ?? roleFallback` stays `false`, so the pencil vanished for editable project groups.

**Fix:** Drawer fetches `GET /api/company-groups/{id}/` (actor-aware), renders pencil from that `can_edit`, updates list cache, and does not role-fallback-grant edit while waiting. `can_delete` stays independent.
