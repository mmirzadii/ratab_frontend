# User Actions Required

1. **Live QA with a running backend** — walk the manual checklist in `TEST_RESULTS.md` (subscription/quota display, 429 block, payment probe). The frontend cannot verify real quota/payment responses offline.
2. **Admin activation for subscription / token top-up** — online payment is disabled (`PAYMENTS_DISABLED`); only an administrator can activate subscriptions or grant tokens for end-to-end testing of active-plan and post-limit recovery flows.
3. **Unresolved owner decisions (backend / product)** — per `KNOWN_LIMITATIONS.md`, subscription plans and token packages are not seeded, and `FREE_PLAN_DAILY_MESSAGE_LIMIT` may be unset (unlimited). Do not ask the frontend to invent production codes or free-tier numbers; seed or configure them on the backend when ready.

No other user action is required.
