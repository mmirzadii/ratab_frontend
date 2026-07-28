# Frontend handoff — current cumulative backend

Use this guide with `OPENAPI.yaml`. Backend version: `BACKEND_VERSION` = `v1.0`
(cumulative: preserved v0 financial/pricebook APIs + v1 auth/workspace/messaging/
files/wallet/quota/payments-disabled).

## Base URL expectations

- Local Docker API is commonly published on host port **15000** → container 8000
  (see `docker-compose.local.yml`). Confirm the URL for your environment.
- Dev/prod base URLs are deployment-owned. Do not hardcode secrets or private
  hostnames from docs into production builds.
- `GET /api/` has no index route (404 is expected). Use explicit paths.

## Environment assumptions

| Environment | Auth | Notes |
| --- | --- | --- |
| Local | Session + CSRF; local any-code signup may be enabled | `credentials: include` |
| Dev | Session + CSRF; local any-code forbidden | Configure CORS/CSRF trusted origins |
| Production | Session + CSRF; Secure cookies; docs off by default | Same-site / HTTPS required |

## Application startup

1. `GET /api/auth/csrf/`
2. `GET /api/auth/me/` with credentials
3. If 401 → unauthenticated routes (login/signup)
4. If 200 → restore session UI (companies, wallet, quota)

## Signup / login / logout

See `AUTH_AND_CSRF.md` for the exact contract.

Local verification accepts any non-empty numeric code **only** in local debug
mode — keep the verification UI anyway.

## Authenticated routing

- Unauthenticated users: auth screens only.
- Authenticated users: workspace selection, then company-scoped screens.
- On 401 from an API call: clear UI session and return to login.
- Logout: `POST /api/auth/logout/` with CSRF → expect 204.

## Companies, roles, groups

- Create/list companies; switch active company in the UI.
- Roles: `owner`, `admin`, `employee` — see `PERMISSIONS.md`.
- Hide management controls for employees, but still handle 403 from the API.
- Groups: any member can create; messaging requires **group membership**, not
  merely company admin.
- Last active owner cannot be demoted/removed — show a clear error from 409/400.

## Messages, files, attachments

- Messages: `GET|POST /api/company-groups/{group_id}/messages/` (page size 50).
- Payload: optional `text` and/or `attachments: [{attachment_type, resource_id}]`.
- Types: `file` | `financial_document` only.
- Upload files first via `POST /api/companies/{company_id}/files/` (multipart
  `file`, optional `checksum_sha256`).
- Open/download only through authorized endpoints; never expect public URLs.
- Quota: on 429 `MESSAGE_QUOTA_EXCEEDED`, disable send and show `resets_at`.

## Pricebooks and calculations

- Browse editions → chapters → groups → items.
- Row codes are **strings** (preserve leading zeros).
- `POST /api/pricebook-items/{id}/calculate/` is preview only and **does not**
  charge tokens.
- Backend calculation is authoritative; do not trust client math as truth.

## Financial documents

- Create/list under a project; edit lines while unlocked.
- Official pricebook-backed line create charges **exactly 5 tokens** on success.
- Standalone starred/custom lines without a pricebook item do **not** charge.
- Edit/delete/recalculate/preview/export do **not** charge.
- Always send a client `idempotency_key` for line creates that may be retried.
- Locked documents: disable edits; handle backend conflict responses.
- Export may be blocked while PDF rendering is unavailable (409).

## Wallet

- `GET /api/token-wallet/` and `/transactions/` — current user only.
- Refresh wallet after successful charged line create.
- On 402 `INSUFFICIENT_TOKEN_BALANCE`, show `required_tokens` vs
  `available_tokens`.
- Never send cost, balance, grant, or payment status as client authorities.

## Subscriptions and quota

- `GET /api/subscription-plans/`, `/api/subscription/`, `/api/message-quota/`.
- Display limits; do not invent production plan codes or free-tier numbers.
- Null daily limit means unlimited (usage may still be recorded).

## Disabled payments

- `POST /api/payments/orders/` with only `package_code` (+ optional
  `idempotency_key`) returns 503 `PAYMENTS_DISABLED`.
- UX: explain that top-ups/subscriptions are admin-activated for now.

## Pagination, loading, concurrency

- Page-number pagination: `?page=`, page size **50**, shape
  `{count, next, previous, results}`.
- Prefer idempotency keys for unsafe retries of charged creates.
- Concurrent last-slot message sends: expect one success and one 429.

## Errors

See `ERROR_CODES.md`. Prefer stable `code` fields when present.

## Backend vs presentation

| Rule | Enforced by |
| --- | --- |
| Auth, CSRF, membership, cross-company isolation | Backend |
| Token charge, quota, payment disable | Backend |
| Hiding admin buttons for employees | UI only (still handle 403) |
| Confirming “this will cost 5 tokens” | UI only (backend still charges 5) |

## Health (optional for apps)

- `/api/health/` and `/api/health/live/` — liveness
- `/api/health/ready/` — 200 ready / 503 degraded with check map
