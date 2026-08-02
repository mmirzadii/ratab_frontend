# Implementation report — group/project deletion & project settings

Date: 2026-07-31

## Summary

Focused backend correction (no frontend changes, no DB flush, no commit):

- Public group hard-delete is always rejected (`PUBLIC_GROUP_DELETE_FORBIDDEN`).
- Ordinary custom groups support confirmed hard delete (`DELETE_GROUP`).
- Project groups delete only via linked project deletion (`DELETE_PROJECT`).
- Non-destructive deletion preview endpoints return counts + warning metadata.
- Project-group settings edit linked Project fields; rename syncs group name.
- New Employee permission keys: `can_delete_custom_groups`, `can_delete_projects`
  (edit continues to use `can_update_projects`).

## Deletion ownership graph

### Ordinary custom group

Deletes: group, group memberships (CASCADE), invitations targeting the group
(CASCADE), group messages, message attachments, message lifecycle events.

Does not delete: company, company members, other groups/projects, wallets,
subscriptions, storage files still referenced elsewhere.

### Project (+ project group)

Deletes: project financial documents and dependents (lines, line coefficients,
document pricebooks, chapter totals, exports), calculation sessions/receipts and
pricebook usage logs for those documents, project coefficient sets/values
(CASCADE from project), project row, then project-group messages/attachments and
the project group.

Does not delete: company, public group, other projects, token ledger rows,
unrelated messages/files.

Physical `StorageFile` rows are not deleted by this service; attachments
SET_NULL / detach. Orphan cleanup remains the existing storage lifecycle job.

## Code touchpoints

- `apps/companies/workspace_deletion.py` — centralized preview/delete service
- `apps/companies/exceptions.py` — stable API error bodies
- `apps/companies/permissions_catalog.py` — delete permission keys
- `apps/companies/serializers.py` — settings capability fields + preview/confirm
- `apps/companies/views.py` / `apps/projects/views.py` — DELETE + preview actions
- `apps/companies/services.py` — `update_group_settings`, project edit forbidden

## Focused tests

`apps/companies/tests/test_workspace_deletion.py` (+ role hierarchy / group
lifecycle / chat resources regression): **27 passed**.

`python manage.py check` — clean  
`makemigrations --check --dry-run` — no changes  
`spectacular --validate` — Errors: 0; OpenAPI copied to frontend_docs
