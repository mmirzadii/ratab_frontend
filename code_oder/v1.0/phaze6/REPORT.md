# Phase 6 Report — Wallet and 5-Token Pricebook-Line UX

Date: 2026-07-28  
Authority: `FRONTEND_PHASE_06_INSTRUCTIONS.md`  
Contract: `backend_docs/current/` (`OPENAPI.yaml`, `FRONTEND_HANDOFF.md`, `ERROR_CODES.md`, `API_USAGE_EXAMPLES.md`)

## Scope implemented

1. Wallet balance and transaction/usage visibility from the real API.
2. Backend idempotency contract on official pricebook-backed line creation.
3. Exact 5-token charge shown as UI copy at the add-line confirmation point; cost is never sent to or chosen by the client.
4. Insufficient balance (402), duplicate/replay (200 + header), key-reuse conflict (409), and safe-retry handling.
5. Wallet refresh after successful charged creates.

## Changes

### New files

- `src/features/wallet/walletApi.ts`
  - `getTokenWallet` → `GET /api/token-wallet/` (tag `Wallet:BALANCE`)
  - `listTokenWalletTransactions` → `GET /api/token-wallet/transactions/` (tag `Wallet:TRANSACTIONS`)
  - `OFFICIAL_LINE_TOKEN_COST = 5` (UI copy constant only; backend is the charging authority)
  - Helpers: `isInsufficientTokenBalance` (402 + `INSUFFICIENT_TOKEN_BALANCE`), `isIdempotencyKeyReused` (409 + `IDEMPOTENCY_KEY_REUSED`), `formatInsufficientBalanceMessage` (`required_tokens` vs `available_tokens`), `createLineIdempotencyKey` (crypto.randomUUID with fallback), `getTransactionTypeLabel` (Persian labels for the 4 contract transaction types)
- `src/features/wallet/WalletSection.tsx`
  - Balance card + newest-first transaction list (type, timestamp, reason, `row_code` context, signed amount, `balance_after`), manual refresh button, loading/error/empty states. Read-only; no client-side accounting.

### Modified files

- `src/shared/api/baseApi.ts`
  - Added `Wallet` tag type.
  - Declared the real `FetchBaseQueryMeta` on `baseQueryWithCsrf` so `transformResponse` can read response headers (needed for `Idempotent-Replayed`). No runtime behavior change.
- `src/features/financialDocuments/financialDocumentApi.ts`
  - `createFinancialDocumentLine`: `transformResponse` sets `idempotent_replayed: true` when the backend answers with the `Idempotent-Replayed: true` header (exact replay, no second debit). On success it also invalidates `Wallet` tags so the balance/ledger refetch from the backend. New exported type `CreatedFinancialDocumentLine`.
  - `createFinancialDocumentLinesBulk`: invalidates `Wallet` tags on success (refresh only; no cost claims — see contract notes).
- `src/features/costReports/components/ItemDetailModal.tsx` (official pricebook-backed create — the charged path)
  - Generates a client `idempotency_key` per calculation payload (`stablePayloadKey`). The same key is reused when the user retries the identical payload (network failure, unknown outcome, 402 after top-up), so the backend either creates once or replays. The key is regenerated when the payload changes, after success, or after `IDEMPOTENCY_KEY_REUSED`.
  - Success path: clears the stored key; when the response was an idempotent replay, shows "این ردیف قبلاً ثبت شده بود؛ توکن دوباره کسر نشد." instead of a normal add toast — no second debit is implied.
  - Error path: 402 → inline error with `required_tokens` vs `available_tokens` and admin top-up hint (key kept for safe retry); 409 key reuse → key dropped, user asked to retry (new key next attempt); other errors unchanged.
  - Added a fixed informational note above the calculation section: adding this official line costs 5 tokens; calculate/edit/delete/preview are free. Shown only when adding is possible (hidden when the document is locked/missing).
- `src/features/costReports/excelImport/ExcelImportWizardModal.tsx`
  - Bulk submit now maps 402 `INSUFFICIENT_TOKEN_BALANCE` to the same explicit required/available message instead of a generic error.
- `src/pages/AccountSettingsPage.tsx`
  - Renders `WalletSection` below the account card (wallet is user-scoped; `/settings` is the natural placement).

## Contract decisions and mismatches

- **Transactions pagination:** `GET /api/token-wallet/transactions/` is documented with a paginated envelope but no query parameters in `OPENAPI.yaml`. The UI renders the first (newest) page from `results` and does not invent a `page` parameter.
- **Bulk line create:** `/api/financial-documents/{id}/lines/bulk/` and `/excel-plan/` (used since v0) are **absent from the current `OPENAPI.yaml`**, so their billing/idempotency behavior is undocumented. Kept existing behavior, added only a safe wallet refresh on success and friendly 402 handling. No per-line cost is claimed in the bulk UI because the contract does not document it.
- **Charged operations:** per `FRONTEND_HANDOFF.md`, only official pricebook-backed line creates charge (exactly 5 tokens). Starred/custom standalone lines (`StarredItemModal`) do not charge and got no cost UI and no idempotency key (the contract scopes `idempotency_key` to official pricebook-backed creates).
- **Top-up:** payments are disabled backend-wide (`PAYMENTS_DISABLED`); the UI mentions admin-managed charging and implements no payment flow.

## Risks / limitations

- Only the newest transactions page is shown (no pager) until the contract documents pagination parameters for the ledger endpoint.
- The idempotency key is held in component state (modal session). If the user closes the modal after an unknown-outcome failure and re-adds the same item, a new key is generated; the backend may then create a second (intended) line. This matches the contract's client-key model.
- No automated test suite exists in the repo; verification is TypeScript + ESLint + build + manual QA (see `TEST_RESULTS.md`).

## Preserved behavior

- Calculation, totals, line edit/delete, recalculate, lock/finalize, preview, and export flows untouched.
- Phase 1–5: session/CSRF auth, companies, members/roles, groups, persistent messaging, private files, and attachments unchanged (`npm run build` and full lint pass).
