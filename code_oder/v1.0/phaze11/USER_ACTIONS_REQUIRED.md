# Frontend Phase 11 — User Actions Required

No blocking user action required for the frontend Phase 11 code path.

Optional local catalog expansion (backend/operator):

1. Import additional family sources (mechanical/electrical) and/or non-base years under `data/*_pricebook/` if multi-year live UI verification is needed beyond unit tests.
2. Run `python manage.py sync_pricebooks --apply` after adding year folders.
3. Re-open Document Info and confirm independent year lists per family.

Secrets, passwords, and session tokens must not be recorded here.
