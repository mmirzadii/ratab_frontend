# Known limitations — current backend

Documented limitations and unresolved owner decisions only. Do not treat
planned future work as implemented.

## Authentication and messaging delivery

- No real SMS/OTP provider is connected.
- Local signup verification may accept any non-empty numeric code only under
  local debug settings (`local_any_code`). Dev/production reject that mode.
- Existing accounts that never set a password need an administrator-set hashed
  password until an approved recovery flow exists.

## Billing and subscriptions

- Online payment is disabled. `POST /api/payments/orders/` returns
  `PAYMENTS_DISABLED`. No real bank/gateway is connected.
- Token package and subscription plan definitions are not seeded; codes/limits
  are owner decisions.
- `FREE_PLAN_DAILY_MESSAGE_LIMIT` may be empty/unset, which means unlimited
  messaging while usage is still recorded. Do not invent a production number.
- `INITIAL_FREE_TOKENS` defaults to `0` unless operators configure otherwise.
- Manual admin grant/subscription activation is the only top-up path in v1.0.

## Product / rendering

- PDF binary rendering remains unavailable; export download may return conflict
  while blocked.
- Deep MIME/malware content scanning is not implemented.

## API docs / OpenAPI

- Interactive schema/docs are disabled in production by default
  (`ENABLE_API_DOCS=false`, `API_DOCS_PUBLIC=false`).
- OpenAPI generation currently reports **23 warnings (17 unique)** for
  pre-existing coefficient/financial serializer method type hints. Errors: **0**.

## Obsolete behavior (not current frontend contract)

These may still exist for compatibility or history, but must **not** be used as
the normal frontend integration path:

- `POST /api/auth/dev-login/` temporary token issuance;
- `Authorization: Token …` as primary browser auth;
- storing auth secrets in `localStorage` / `sessionStorage`.

## Historical packages

Superseded versioned frontend-doc snapshots (not canonical) live under:

- `codexphaze/v0.0/historical_frontend_docs/`
- `codexphaze/v1.0/historical_frontend_docs/`
