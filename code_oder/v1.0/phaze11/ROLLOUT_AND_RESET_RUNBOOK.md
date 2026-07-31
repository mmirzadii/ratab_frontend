# Phase 11 Rollout / Reset Runbook (Frontend)

Frontend Phase 11 does not require a frontend data reset.

## Frontend deploy notes

1. Sync Backend Phase 11 docs into `backend_docs/current/`.
2. Run `npm run generate:api`.
3. Deploy the frontend build that contains family/year Document Info selection.
4. Confirm Document Info shows `نوع فهرست‌بها` + `سال` against the live catalog.

## Backend catalog (operator)

Local catalog expansion (families/years) is backend/operator owned via:

- `validate_pricebook_family`
- `materialize_pricebook_edition` / `rebuild_pricebook_family`
- `sync_pricebooks --apply`
- Local-only `reset_pricebook_catalog` when authorized

Frontend never hardcodes year lists or `ABN1404` family identity.
