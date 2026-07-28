# User Actions Required

1. **Live Backend v1 QA (deployment gate)** — run the manual checklist in `TEST_RESULTS.md` against a real Backend v1 host with correct CORS/CSRF trusted origins before broad production traffic.
2. **Backend operator setup** — configure non-secret CORS/CSRF origin lists for the frontend origin; seed or admin-activate subscriptions/token grants as needed (online payment is disabled).
3. **Optional owner decisions** — seed subscription plans / token packages if empty lists are undesirable; decide whether to delete the isolated Excel import module once product confirms it will not return under OpenAPI.
4. **Dependency advisories** — review `npm audit` findings reported during the Docker build if security policy requires remediation before production.

No commit/push was performed by this phase.

No other mandatory user action for completing Phase 8 documentation.
