# API usage examples

Fake non-sensitive data only. Match `OPENAPI.yaml` and current serializers.
Assume cookies are included (`credentials: "include"`) and CSRF is set for
mutating calls.

## 1. CSRF bootstrap

```http
GET /api/auth/csrf/
```

```json
{"csrf_token": "masked-csrf-token-example"}
```

## 2. Signup start → verify → complete

```http
POST /api/auth/signup/start/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"phone_number": "09120000001"}
```

```json
{
  "challenge_id": "11111111-1111-1111-1111-111111111111",
  "phone_number": "09120000001",
  "expires_in_seconds": 300
}
```

```http
POST /api/auth/signup/verify/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "challenge_id": "11111111-1111-1111-1111-111111111111",
  "phone_number": "09120000001",
  "verification_code": "12345"
}
```

```json
{
  "signup_ticket": "opaque-one-time-ticket",
  "expires_in_seconds": 600
}
```

```http
POST /api/auth/signup/complete/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "signup_ticket": "opaque-one-time-ticket",
  "password": "ExamplePass123!",
  "password_confirmation": "ExamplePass123!",
  "display_name": "نمونه کاربر"
}
```

```json
{
  "authenticated": true,
  "user": {
    "id": 10,
    "phone_number": "09120000001",
    "display_name": "نمونه کاربر",
    "is_active": true,
    "is_staff": false,
    "created_at": "2026-07-28T12:00:00+03:30",
    "updated_at": "2026-07-28T12:00:00+03:30"
  }
}
```

## 3. Login, me, logout

```http
POST /api/auth/login/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"phone_number": "09120000001", "password": "ExamplePass123!"}
```

```http
GET /api/auth/me/
```

```http
POST /api/auth/logout/
X-CSRFToken: masked-csrf-token-example
```

Logout success: **204** empty body.

## 4. Companies and groups

```http
GET /api/companies/
GET /api/companies/1/groups/
GET /api/companies/1/members/
```

Paginated lists use `{count, next, previous, results}` with page size 50.

## 5. Message create and quota exceeded

```http
POST /api/company-groups/3/messages/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"text": "سلام، سند پیوست شد", "attachments": []}
```

Quota exceeded example:

```json
{
  "code": "MESSAGE_QUOTA_EXCEEDED",
  "detail": "The daily message limit for this account is reached.",
  "used_today": "2",
  "daily_limit": "2",
  "quota_date": "2026-07-28",
  "resets_at": "2026-07-29T00:00:00+03:30"
}
```

HTTP **429**.

## 6. File upload and private download

```http
POST /api/companies/1/files/
Content-Type: multipart/form-data
X-CSRFToken: masked-csrf-token-example

file=@notes.txt
```

```http
GET /api/storage-files/42/download/
```

Binary response with attachment disposition. No public URL field.

## 7. Pricebook calculation preview (no charge)

```http
POST /api/pricebook-items/100/calculate/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"inputs": {"quantity": "1"}}
```

Does not debit the wallet.

## 8. Official financial-document line create (5-token charge)

```http
POST /api/financial-documents/7/lines/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "pricebook_item_id": 100,
  "quantity": "1",
  "idempotency_key": "line-create-7-100-20260728-a1"
}
```

Success: HTTP **201** line payload. Wallet decreases by exactly **5** tokens.

Exact replay of the same key + same payload: HTTP **200** and header
`Idempotent-Replayed: true` (no second debit).

## 9. Insufficient balance

```json
{
  "code": "INSUFFICIENT_TOKEN_BALANCE",
  "detail": "The token wallet does not have enough balance.",
  "required_tokens": "5",
  "available_tokens": "0"
}
```

HTTP **402**.

## 10. Subscription and quota reads

```http
GET /api/subscription/
GET /api/message-quota/
GET /api/subscription-plans/
GET /api/token-wallet/
```

## 11. Disabled payment

```http
POST /api/payments/orders/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"package_code": "tokens-100", "idempotency_key": "pay-try-1"}
```

```json
{
  "code": "PAYMENTS_DISABLED",
  "detail": "Online payment is disabled. Token grants and subscriptions are activated manually by an administrator."
}
```

HTTP **503**. Do not send amount, token count, status, or success flags.
