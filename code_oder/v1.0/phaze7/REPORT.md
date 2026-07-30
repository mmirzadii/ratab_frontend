# Phase 7 Report — Subscription, Message Quota, and Disabled Payment UX

Date: 2026-07-28  
Authority: `FRONTEND_PHASE_07_INSTRUCTIONS.md`  
Contract: `backend_docs/current/` (`OPENAPI.yaml`, `FRONTEND_HANDOFF.md`, `ERROR_CODES.md`, `KNOWN_LIMITATIONS.md`, `API_USAGE_EXAMPLES.md`)

## Scope implemented

1. Frontend-accessible subscription status and plan list from the real API.
2. Daily message usage, effective limit, remaining, and reset time.
3. Stable `MESSAGE_QUOTA_EXCEEDED` handling with backend-provided usage and reset details.
4. Disabled-payment UX and stable `PAYMENTS_DISABLED` handling.
5. No fake checkout, bank redirect, client-side activation, or invented plan/package values.

## Changes

### New files

- `src/features/subscription/subscriptionApi.ts`
  - `getSubscription` → `GET /api/subscription/` (tag `Subscription:CURRENT`)
  - `listSubscriptionPlans` → `GET /api/subscription-plans/` (tag `Subscription:PLANS`)
  - `getMessageQuota` → `GET /api/message-quota/` (tag `MessageQuota:STATUS`)
  - `createPaymentOrder` → `POST /api/payments/orders/` (body: `package_code` + optional `idempotency_key` only)
  - Helpers: `isPaymentsDisabled`, `formatPaymentsDisabledMessage`, `formatQuotaUsageLabel`, `formatQuotaResetsAt`, `formatSubscriptionStatusLabel`
- `src/features/subscription/SubscriptionSection.tsx`
  - Settings card: current subscription, effective daily limit, quota usage/reset, backend plan list (empty state when unseeded), disabled-payment banner
  - “بررسی وضعیت پرداخت آنلاین” probes the payments endpoint and surfaces `PAYMENTS_DISABLED` in Persian (or unexpected/other errors)

### Modified files

- `src/shared/api/baseApi.ts` — added `Subscription` and `MessageQuota` tag types
- `src/pages/AccountSettingsPage.tsx` — renders `SubscriptionSection` above the wallet card
- `src/features/companies/companyMessagesApi.ts`
  - Successful message create invalidates `MessageQuota:STATUS`
  - `formatQuotaResetHint` optionally includes `used_today` / `daily_limit` from the 429 body
- `src/features/companies/MessagesSection.tsx`
  - Loads/refreshes message quota; shows usage + reset near compose
  - On 429: disable send, show full hint, refetch quota
  - Soft UX unlock when a later quota refetch shows remaining > 0 or unlimited (backend still authorizes each send)
- `src/features/wallet/WalletSection.tsx` — copy notes that online payment is disabled (admin top-up only)

## Contract decisions and unresolved values

- **Null daily limit** = unlimited / not configured (`FRONTEND_HANDOFF`, `KNOWN_LIMITATIONS` `FREE_PLAN_DAILY_MESSAGE_LIMIT`). UI never invents a free-tier number; usage is still shown when recorded.
- **Plan / package seeding:** `KNOWN_LIMITATIONS` states token packages and subscription plans are not seeded. Empty plan list is shown honestly. No client-defined plan codes, limits, or prices.
- **Payment probe package code:** There is no token-package list API. The availability check uses `tokens-100` solely as the documented example from `API_USAGE_EXAMPLES.md` §11 to exercise `PAYMENTS_DISABLED`. It is **not** presented as a purchasable package and never sends amount/token count/status.
- **No client subscription activation** — plans are display-only; activation remains admin-only while payments are disabled.
- **Quota UX vs security** — compose hints and post-429 disable are UX only; each send still goes to the backend, which is the quota authority.

## Risks / limitations

- Payment probe uses a documentation example package code because packages are unseeded and no list endpoint exists; if the backend later validates unknown codes differently before returning `PAYMENTS_DISABLED`, the probe may show a different error (still handled; still no fake success).
- Soft unlock after `resets_at` depends on a quota refetch (manual refresh / successful send invalidation / 429 refetch), not a local timer.
- No automated test suite in the repo.

## Preserved behavior

- Phase 1–6: session/CSRF, companies, members/groups, messaging + attachments, wallet + idempotent charged operations, calculation/lock/preview/export unchanged (`tsc`, lint, build pass).

---

## Correction (2026-07-30) — single current plan in catalog

**Cause of apparent two-active plans:** catalog listed Bronze and Silver equally; FE had no `is_current` usage (stale OpenAPI). Summary used `has_active_subscription`, which is false for Bronze free fallback, so the effective plan was unclear while both catalog rows looked “live.”

**Fix:**

- Synced OpenAPI: `effective_plan_code`, plan `is_current` / `is_available` / `is_free_fallback` / `can_activate`
- SOT: `GET /api/subscription/` → `effective_plan_code`
- Exactly one catalog `فعال` badge: `plan.code === effective_plan_code`
- Never treat `is_available` as current
- Bronze remains listed when Silver is current, without a second `فعال`
## Correction (2026-07-30) � account settings subscription UX

`/settings?tab=subscription` uses an effective-plan summary and a responsive plan card grid. Exactly one `????` from `effective_plan_code`. Prices shown as ?????; plan codes hidden from primary UI.

## Correction (2026-07-30) � demo purchase vs disabled online payment

Online `POST /api/payments/orders/` remains `PAYMENTS_DISABLED`. Local/Dev instant Buy is a separate demo endpoint gated by wallet `commerce.demo_purchase_available`. UX shows concise `???? ?????? ????? ???? ????.` when purchasing is unavailable.
