# Ratab Frontend v1.0 Phase 12
## Secure Admin Panel with One Superuser, Delegated Admin Permissions, Commerce and Tickets

Use completed Backend Phase 12 OpenAPI/handoff as authority.

Do not modify backend code. Do not invent endpoints or capability strings.

## Core model

- One root Superuser.
- Superuser alone manages Admins.
- Superuser promotes an existing user by exact phone number and assigns granular capabilities.
- Active Admins always have dashboard + ticket view/reply.
- Other sections/actions appear only from Backend capabilities.
- Company Owner/Manager/Employee roles never imply platform-admin access.

## 1. Contract sync

Read AGENT_READ_ORDER and synced backend_docs/current. Run generate:api. Never hand-edit generated schema.

## 2. Admin identity and route guard

Create centralized:

```text
usePlatformAdmin
AdminRouteGuard
Can
requireCapability
```

`/api/platform-admin/me/` authority fields:

- is_platform_admin
- is_superuser
- baseline_capabilities
- granted_capabilities
- effective capabilities
- step-up state

UI guards are UX only; handle backend 403.

## 3. Admin shell

Routes conceptually:

```text
/admin
/admin/support/tickets
/admin/users
/admin/companies
/admin/commerce/packages
/admin/commerce/plans
/admin/commerce/orders
/admin/commerce/adjustments
/admin/subscriptions
/admin/audit
/admin/operations
/admin/admins   # superuser only
```

Navigation is capability-driven.

Support/Tickets must appear for every active Admin.

## 4. Superuser Admin management

Only if `is_superuser=true`, show `مدیران پلتفرم`.

Required flow:

1. enter exact phone number
2. call lookup endpoint
3. show safe user preview
4. select optional capabilities grouped by domain
5. show mandatory baseline ticket capabilities as locked/read-only
6. enter reason
7. Step-up
8. confirm create Admin

Admin detail:

- status/expiry
- baseline + granted capabilities
- add/revoke grants
- deactivate/reactivate
- history

Rules:

- no partial phone autocomplete unless contract explicitly provides it
- no Admin can access this UI
- no capability string hardcoding beyond generated catalog representation
- capability catalog from Backend
- root transfer separate destructive flow

## 5. Capability groups UI

Group optional permissions:

- users
- companies
- wallets/adjustments
- packages
- plans/subscriptions
- orders
- ticket advanced controls
- audit
- operations

Baseline box:

```text
پاسخ‌گویی به تیکت‌ها برای همه مدیران فعال است
```

with view/reply locked.

## 6. Dashboard

Compact operational dashboard from Backend metrics. No marketing hero. Currency-separated totals.

## 7. User/company administration

- server-side tables/filters/detail drawers
- secure actions with reason/step-up
- no sensitive fields
- no optimistic destructive action

## 8. Commerce

Packages:

- list/create/edit/archive
- price/token amount/currency/display order
- snapshot warning

Plans:

- create/edit/archive
- price/duration/limits/entitlements
- snapshot warning

Orders:

- detail snapshots/provider/ledger/timeline
- safe actions only

Adjustments/subscriptions:

- request/approve/apply per capability
- reason/idempotency/reference
- no direct balance edit

## 9. Tickets

User support area:

- own list/create/detail/reply/close/reopen policy

Admin support area for every active Admin:

- list/filter/detail
- public reply always available
- attachment authorized download

Advanced controls only by capability:

- internal note
- assignment
- priority
- status management

Internal note visually and API-wise separate from public reply.

## 10. Step-up UX

Shared dialog:

- password
- generic error
- no storage
- focus trap
- expires state
- resume pending action after success

## 11. Tables/forms/security

- server pagination
- URL-backed filters
- mobile cards
- Decimal-safe money display
- no secrets in console
- private files via authorized endpoint
- no unsafe CSV/client export

## 12. Visual design

- professional compact RTL admin
- high-density but readable
- no marketing hero
- clear status and destructive sections
- responsive/accessibility/focus

## 13. Focused tests

- route/me guard
- superuser-only admin management
- exact phone lookup/create flow
- mandatory ticket baseline shown locked
- Admin cannot see admin-management route
- capability-based section/action visibility
- all Admins can open/reply tickets
- advanced ticket controls gated
- package/plan/order/adjustment flows
- step-up/403/409/429
- pagination/mobile/no sensitive fields

Run generate:api, focused tests, tsc, lint, build.

## Completion

Complete when:

- root Superuser admin-management works
- delegated capability UX works
- all Admins support tickets
- commerce/admin flows usable
- security/step-up/capability guard correct
- tests/build/docs green

Do not commit/push. Stop after Frontend Phase 12.
