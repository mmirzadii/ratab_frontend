# Backend → Frontend Contract Sync

After Backend Phase 12 is complete:

1. ensure OpenAPI validation has zero errors;
2. copy canonical backend `codexphaze/frontend_docs/*` into frontend `backend_docs/current/*`;
3. verify contract includes:
   - `is_superuser`, `is_platform_admin`
   - baseline/granted/effective capabilities
   - exact phone candidate lookup
   - Superuser-only Admin create/update/revoke/reactivate/history/transfer
   - capability catalog
   - universal Admin ticket list/detail/reply
   - advanced ticket capability actions
   - packages/plans/orders/adjustments/users/companies/audit/operations
4. run `npm run generate:api`;
5. do not hand-edit generated schema.
