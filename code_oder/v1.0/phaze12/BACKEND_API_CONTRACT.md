# Proposed Phase 12 Backend API Contract

نام دقیق endpointها می‌تواند با convention پروژه هماهنگ شود؛ رفتار زیر الزامی است.

## Session and capabilities

```text
GET  /api/platform-admin/me/
POST /api/platform-admin/step-up/
GET  /api/platform-admin/dashboard/
```

نمونه `me`:

```json
{
  "is_platform_admin": true,
  "is_superuser": false,
  "baseline_capabilities": [
    "admin.dashboard.view",
    "admin.tickets.view",
    "admin.tickets.reply"
  ],
  "granted_capabilities": ["admin.orders.view"],
  "capabilities": [
    "admin.dashboard.view",
    "admin.tickets.view",
    "admin.tickets.reply",
    "admin.orders.view"
  ],
  "step_up": {"verified": false, "expires_at": null}
}
```

## Superuser admin-management APIs

همه endpointهای این بخش root-superuser-only + Step-up + reason + CSRF هستند.

```text
POST /api/platform-admin/superuser/admin-candidates/lookup-by-phone/
GET  /api/platform-admin/superuser/admins/
POST /api/platform-admin/superuser/admins/
GET  /api/platform-admin/superuser/admins/{id}/
PATCH /api/platform-admin/superuser/admins/{id}/
POST /api/platform-admin/superuser/admins/{id}/revoke/
POST /api/platform-admin/superuser/admins/{id}/reactivate/
GET  /api/platform-admin/superuser/admins/{id}/history/
GET  /api/platform-admin/superuser/capability-catalog/
POST /api/platform-admin/superuser/transfer/
```

Lookup request:

```json
{"phone_number": "09..."}
```

Create Admin request:

```json
{
  "phone_number": "09...",
  "capabilities": ["admin.orders.view", "admin.packages.manage"],
  "expires_at": null,
  "reason": "Finance operations access"
}
```

Baseline ticket capabilities client-controlled نیستند و Backend خودکار اضافه می‌کند.

## Users

```text
GET  /api/platform-admin/users/
GET  /api/platform-admin/users/{id}/
POST /api/platform-admin/users/{id}/suspend/
POST /api/platform-admin/users/{id}/reactivate/
POST /api/platform-admin/users/{id}/revoke-sessions/
GET  /api/platform-admin/users/{id}/wallet/
GET  /api/platform-admin/users/{id}/subscriptions/
POST /api/platform-admin/users/{id}/subscriptions/activate/
POST /api/platform-admin/users/{id}/subscriptions/cancel/
```

## Companies

```text
GET  /api/platform-admin/companies/
GET  /api/platform-admin/companies/{id}/
POST /api/platform-admin/companies/{id}/suspend/
POST /api/platform-admin/companies/{id}/restore/
POST /api/platform-admin/companies/{id}/transfer-ownership/
```

## Packages and plans

```text
GET/POST /api/platform-admin/token-packages/
GET/PATCH /api/platform-admin/token-packages/{id}/
POST      /api/platform-admin/token-packages/{id}/archive/

GET/POST /api/platform-admin/subscription-plans/
GET/PATCH /api/platform-admin/subscription-plans/{id}/
POST      /api/platform-admin/subscription-plans/{id}/archive/
```

## Orders and ledger

```text
GET  /api/platform-admin/payment-orders/
GET  /api/platform-admin/payment-orders/{id}/
POST /api/platform-admin/payment-orders/{id}/cancel/
POST /api/platform-admin/payment-orders/{id}/retry-verification/
GET  /api/platform-admin/wallet-transactions/
```

## Financial adjustments

```text
GET/POST /api/platform-admin/financial-adjustments/
GET       /api/platform-admin/financial-adjustments/{id}/
POST      /api/platform-admin/financial-adjustments/{id}/approve/
POST      /api/platform-admin/financial-adjustments/{id}/reject/
POST      /api/platform-admin/financial-adjustments/{id}/apply/
```

## User support tickets

```text
GET/POST /api/support/tickets/
GET      /api/support/tickets/{id}/
POST     /api/support/tickets/{id}/messages/
POST     /api/support/tickets/{id}/close/
POST     /api/support/tickets/{id}/reopen/
GET      /api/support/unread-count/
```

## Admin support tickets

All active Admins may call list/detail/reply.

```text
GET  /api/platform-admin/support/tickets/
GET  /api/platform-admin/support/tickets/{id}/
POST /api/platform-admin/support/tickets/{id}/reply/
```

Capability-specific:

```text
POST /api/platform-admin/support/tickets/{id}/internal-notes/
POST /api/platform-admin/support/tickets/{id}/assign/
POST /api/platform-admin/support/tickets/{id}/change-priority/
POST /api/platform-admin/support/tickets/{id}/resolve/
POST /api/platform-admin/support/tickets/{id}/close/
POST /api/platform-admin/support/tickets/{id}/reopen/
```

## Audit and operations

```text
GET /api/platform-admin/audit-events/
GET /api/platform-admin/operations/health/
GET /api/platform-admin/operations/pricebooks/
GET /api/platform-admin/operations/quotas/
```

## Stable errors

```text
PLATFORM_ADMIN_REQUIRED
PLATFORM_SUPERUSER_REQUIRED
PLATFORM_CAPABILITY_REQUIRED
PLATFORM_ADMIN_STEP_UP_REQUIRED
PLATFORM_ADMIN_STEP_UP_FAILED
PLATFORM_ADMIN_PHONE_EXACT_MATCH_REQUIRED
PLATFORM_ADMIN_TARGET_NOT_FOUND
PLATFORM_ADMIN_TARGET_INACTIVE
PLATFORM_ADMIN_ALREADY_ACTIVE
PLATFORM_ADMIN_NOT_ACTIVE
PLATFORM_ADMIN_CAPABILITY_UNKNOWN
PLATFORM_ADMIN_BASELINE_CAPABILITY_IMMUTABLE
PLATFORM_SUPERUSER_SINGLETON_CONFLICT
PLATFORM_SUPERUSER_TRANSFER_INVALID
USER_ALREADY_SUSPENDED
COMPANY_ALREADY_SUSPENDED
FINANCIAL_ADJUSTMENT_SELF_APPROVAL_FORBIDDEN
PACKAGE_CODE_IMMUTABLE
PLAN_CODE_IMMUTABLE
PAYMENT_ORDER_STATUS_CONFLICT
SUPPORT_TICKET_ACCESS_DENIED
SUPPORT_TICKET_CLOSED
SUPPORT_INTERNAL_NOTE_FORBIDDEN
```

## Response principles

- server-side pagination
- filter/sort whitelist
- stable schemas
- masked sensitive identifiers
- no secrets/raw model dumps
- timestamps ISO 8601
- money as Decimal-safe strings
