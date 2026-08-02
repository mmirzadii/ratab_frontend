# Phase 12 Frontend Report

Status: **complete** (frontend only)

## Goal delivered

Secure platform-admin UI with:

- one root Superuser Admin-management surface
- exact phone lookup promotion + optional capability grants
- mandatory locked baseline ticket view/reply for every active Admin
- capability-driven navigation and section gates
- commerce admin (packages/plans/orders/adjustments)
- user support tickets + admin support tickets
- shared password Step-up dialog (no storage)

## Contract sync

1. Backend Phase 12 marked complete (`514` backend tests; OpenAPI errors `0`).
2. Synced `ratab_backend/codexphaze/frontend_docs/*` → `backend_docs/current/*`.
3. Applied existing GroupMessage OpenAPI spectacular fix script, then `npm run generate:api`.
4. Generated `schema.ts` not hand-edited.

## Identity / guards

| Piece | Location |
| --- | --- |
| `usePlatformAdmin` | `src/features/platformAdmin/usePlatformAdmin.ts` |
| `AdminRouteGuard` | `src/features/platformAdmin/AdminRouteGuard.tsx` |
| `Can` | `src/features/platformAdmin/Can.tsx` |
| `requireCapability` / helpers | `src/features/platformAdmin/platformAdminCapabilities.ts` |

Authority source: `GET /api/platform-admin/me/` (`is_platform_admin`, `is_superuser`, baseline/granted/effective capabilities, step-up). Company roles / `is_staff` never unlock admin routes.

## Admin shell & routes

Routes under authenticated `AppShell`:

- `/admin` dashboard
- `/admin/support/tickets` (+ detail)
- `/admin/users`, `/admin/companies`
- `/admin/commerce/packages|plans|orders|adjustments`
- `/admin/subscriptions`, `/admin/audit`, `/admin/operations`
- `/admin/admins` (+ detail) — **superuser only**
- `/support/tickets` (+ detail) — user support

Primary nav shows **پشتیبانی** for all authenticated users and **مدیریت پلتفرم** only when `is_platform_admin`.

## Superuser Admin management

- Exact phone lookup (`lookup-by-phone`), safe candidate preview
- Capability catalog from Backend; baseline ticket capabilities locked/read-only with copy: «پاسخ‌گویی به تیکت‌ها برای همه مدیران فعال است»
- Create / update / revoke / reactivate / history / root transfer with Step-up + reason

## Tickets

- All Admins: list/detail/public reply
- Advanced controls gated: internal note, assign, priority, status
- User APIs never call internal-note endpoints; UI filters `internal_note`

## Commerce / ops

Packages, plans, orders, adjustments, audit, operations pages wired to platform-admin endpoints. Sensitive mutations use `runWithStepUp`. Money shown as Decimal-safe strings; currency totals separated on dashboard.

## Security UX

- Step-up dialog: password only, cleared after use, no local/session storage, Escape/close cancel, resumes pending action
- UI gates are UX only; backend 403/409/429 surfaced via `formatPlatformAdminError`

## Validation

See `TEST_RESULTS.md`: focused platform-admin tests, tsc, lint (0 errors), build green.

## Limitations

- Some OpenAPI operation request bodies remain loosely typed by spectacular (e.g. step-up body); runtime bodies follow Backend serializers / handoff.
- Nested list pages render dense tables; mobile cards where implemented.
- Online payment retry UX depends on backend provider availability while payments disabled.

## Out of scope / not done

- Backend code changes
- Commit / push
