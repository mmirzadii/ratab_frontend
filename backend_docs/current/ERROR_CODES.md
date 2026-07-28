# Stable frontend-relevant errors

Only codes and outcomes the current backend actually returns. Do not invent
codes. Field names match APIException JSON bodies unless noted.

## Catalog

### Authentication required

| | |
| --- | --- |
| Code / shape | Usually `{"detail":"…"}` (DRF); no stable business `code` |
| HTTP | 401 |
| Operations | Any authenticated endpoint without a valid session (or legacy token) |
| Meaning | Not authenticated |
| Frontend | Route to login; clear local auth UI state |
| Retry | Safe after login |
| Action required | User login |

### Invalid credentials

| | |
| --- | --- |
| Code | DRF `invalid_credentials` metadata; body typically `{"detail":"…"}` |
| HTTP | 401 |
| Operations | `POST /api/auth/login/` |
| Meaning | Unknown phone or wrong password (generic) |
| Frontend | Show generic failure; do not reveal which field was wrong |
| Retry | Safe with corrected credentials |
| Action required | User |

### CSRF failure

| | |
| --- | --- |
| Code / shape | Django/DRF 403 detail |
| HTTP | 403 |
| Operations | State-changing session requests missing/invalid `X-CSRFToken` |
| Meaning | CSRF check failed |
| Frontend | `GET /api/auth/csrf/`, then retry once |
| Retry | Safe once after CSRF refresh |
| Action required | Client retry |

### Permission denied / cross-company

| | |
| --- | --- |
| Code / shape | `{"detail":"…"}` |
| HTTP | 403 |
| Operations | Company, group, message, file, document access |
| Meaning | Authenticated but not allowed |
| Frontend | Show access denied; do not retry with guessed IDs |
| Retry | Not safe as-is |
| Action required | Different account or membership |

### Resource not found / unavailable

| | |
| --- | --- |
| Code / shape | `{"detail":"…"}` |
| HTTP | 404 |
| Operations | Missing IDs; pending/failed files; missing attachment targets; disabled `dev-login` |
| Meaning | Not found or not available |
| Frontend | Treat as missing resource |
| Retry | Not useful unless resource appears later |
| Action required | User navigation |

### Validation error

| | |
| --- | --- |
| Code / shape | Field-keyed DRF errors, e.g. `{"phone_number":["…"]}` |
| HTTP | 400 |
| Operations | Most POST/PATCH bodies |
| Meaning | Invalid input |
| Frontend | Map field errors into forms |
| Retry | Safe after correcting input |
| Action required | User |

### File validation / storage failure

| | |
| --- | --- |
| Code | Validation 400; storage issues may be 503 with generic detail (`storage_unavailable`) |
| HTTP | 400 or 503 |
| Operations | Company file upload, open/download |
| Meaning | Rejected file metadata/size/type, or storage unavailable |
| Frontend | Show upload error; do not expose backend storage details |
| Retry | 400: after fix; 503: later |
| Action required | User / ops |

### Insufficient tokens

| | |
| --- | --- |
| Code | `INSUFFICIENT_TOKEN_BALANCE` |
| HTTP | 402 |
| Operations | `POST /api/financial-documents/{id}/lines/` with official pricebook item |
| Fields | `code`, `detail`, `required_tokens`, `available_tokens` (strings) |
| Meaning | Wallet lacks tokens for the fixed 5-token charge |
| Frontend | Block create; show required vs available; offer admin/top-up UX note |
| Retry | Safe after balance increases |
| Action required | Admin grant (payments disabled) |

### Idempotency key reused for different request

| | |
| --- | --- |
| Code | `IDEMPOTENCY_KEY_REUSED` |
| HTTP | 409 |
| Operations | Pricebook-backed line create with `idempotency_key` |
| Meaning | Same key was used for a different payload |
| Frontend | Generate a new key; do not reuse |
| Retry | Only with a new key |
| Action required | Client |

### Exact idempotent replay (success)

| | |
| --- | --- |
| Outcome | HTTP **200** + header `Idempotent-Replayed: true` |
| Operations | Exact same line create + same `idempotency_key` |
| Meaning | Original line returned; **no second charge** |
| Frontend | Treat as success; do not show a second debit |
| Retry | Already safe |

### Document locked / membership conflict / export not ready

| | |
| --- | --- |
| Codes | Often plain detail; membership may use `membership_conflict`; export `export_not_ready` |
| HTTP | 409 |
| Operations | Locked document mutations; protected member delete; PDF download while blocked |
| Meaning | Conflicting state |
| Frontend | Refresh resource; disable conflicting UI |
| Retry | Not until state changes |
| Action required | User / admin |

### Message quota exceeded

| | |
| --- | --- |
| Code | `MESSAGE_QUOTA_EXCEEDED` |
| HTTP | 429 |
| Operations | `POST /api/company-groups/{id}/messages/` |
| Fields | `code`, `detail`, `used_today`, `daily_limit`, `quota_date`, `resets_at` (counts as strings) |
| Meaning | Daily message limit reached |
| Frontend | Disable send; show reset time |
| Retry | After `resets_at` or limit increase |
| Action required | Wait / admin subscription |

### Payments disabled

| | |
| --- | --- |
| Code | `PAYMENTS_DISABLED` |
| HTTP | 503 |
| Operations | `POST /api/payments/orders/` |
| Fields | `code`, `detail` |
| Meaning | Online payment is intentionally disabled |
| Frontend | Show “payments unavailable; contact admin for tokens/subscription” |
| Retry | Not until product enables payments |
| Action required | Admin manual grant/activation |

### Readiness degraded

| | |
| --- | --- |
| Shape | `{status:"degraded", service:"ratab-backend", checks:{database,redis,storage}}` |
| HTTP | 503 |
| Operations | `GET /api/health/ready/` |
| Meaning | Dependency unavailable |
| Frontend | Optional ops banner; do not expose internals |
| Retry | Later |
| Action required | Ops |

## Notes

- Successful official pricebook line create returns **201**; exact replay returns
  **200** with `Idempotent-Replayed: true`.
- Logout success is **204** with empty body.
- Never surface stack traces or storage credentials from error payloads.
