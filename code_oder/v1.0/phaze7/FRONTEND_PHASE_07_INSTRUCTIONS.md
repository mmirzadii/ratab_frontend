# Phase 7 — Subscription, Message Quota, and Disabled Payment UX

Read the common rules, current subscription/quota/payment contract, prior reports, and the completed message/wallet UI.

## Goal

Expose the current subscription and quota state and handle the disabled payment boundary clearly.

## Work

- Integrate the frontend-accessible subscription and daily message-usage data.
- Show quota state and handle `MESSAGE_QUOTA_EXCEEDED` as a stable product condition with backend-provided reset details.
- Keep message creation behavior consistent with the completed messaging flow.
- Handle the disabled payment endpoint and `PAYMENTS_DISABLED` response with clear Persian UX.
- Do not create a fake checkout, fake payment success, card form, client-side token credit, or client-selected package values beyond the real contract.
- Document unresolved business values instead of inventing plan definitions or limits.

Run the relevant checks, update `phaze7/` reports, and stop.
