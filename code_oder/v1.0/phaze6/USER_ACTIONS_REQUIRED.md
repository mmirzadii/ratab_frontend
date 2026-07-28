# User Actions Required

1. **Live QA with a seeded wallet** — run the backend, log in as a user with a token grant, and walk the manual checklist in `TEST_RESULTS.md` (charge, insufficient balance, idempotent replay). The frontend cannot verify real debits offline.
2. **Admin token grants** — online payment is disabled backend-wide (`PAYMENTS_DISABLED`); to test the insufficient-balance and top-up-then-retry flows an administrator must grant tokens manually.
3. **Optional contract follow-up (backend team)** — `GET /api/token-wallet/transactions/` documents no pagination query parameters, and `/lines/bulk/` + `/excel-plan/` are absent from `OPENAPI.yaml`; the frontend intentionally avoids inventing behavior for these (see `REPORT.md`).

No other user action is required.
