# Phase 6 — Wallet and 5-Token Pricebook-Line UX

Read the common rules, wallet/ledger/idempotency contract, prior reports, and the existing financial-document line flow.

## Goal

Integrate wallet visibility and the approved token-charge experience without changing financial calculation ownership.

## Work

- Add the frontend-supported wallet balance and transaction/usage views from the real API.
- Update official pricebook-backed line creation to follow the backend idempotency contract.
- Show the exact 5-token charge at the appropriate confirmation/result points without sending the cost to the backend.
- Handle insufficient balance, unknown outcome, safe retry, success refresh, and duplicate-attempt behavior.
- Preserve all existing calculation, totals, edit/delete, lock/finalize, preview, and export flows.
- Do not show no-charge operations as billable and do not build client-side wallet accounting.

Run the relevant checks, update `phaze6/` reports, and stop.
