# Phase 6 Report ? Wallet and 5-Token Pricebook-Line UX

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
  - `getTokenWallet` ? `GET /api/token-wallet/` (tag `Wallet:BALANCE`)
  - `listTokenWalletTransactions` ? `GET /api/token-wallet/transactions/` (tag `Wallet:TRANSACTIONS`)
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
  - `createFinancialDocumentLinesBulk`: invalidates `Wallet` tags on success (refresh only; no cost claims ? see contract notes).
- `src/features/costReports/components/ItemDetailModal.tsx` (official pricebook-backed create ? the charged path)
  - Generates a client `idempotency_key` per calculation payload (`stablePayloadKey`). The same key is reused when the user retries the identical payload (network failure, unknown outcome, 402 after top-up), so the backend either creates once or replays. The key is regenerated when the payload changes, after success, or after `IDEMPOTENCY_KEY_REUSED`.
  - Success path: clears the stored key; when the response was an idempotent replay, shows "??? ???? ????? ??? ??? ???? ???? ?????? ??? ???." instead of a normal add toast ? no second debit is implied.
  - Error path: 402 ? inline error with `required_tokens` vs `available_tokens` and admin top-up hint (key kept for safe retry); 409 key reuse ? key dropped, user asked to retry (new key next attempt); other errors unchanged.
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
- Phase 1?5: session/CSRF auth, companies, members/roles, groups, persistent messaging, private files, and attachments unchanged (`npm run build` and full lint pass).

---

## Correction (2026-07-30) ? calculation-based token policy

The fixed **5-token official line-create** UX described above is **obsolete** and removed from the running frontend.

Current contract-driven behavior:

- Free item inspection / local validation (no billing request on open or typing).
- No automatic/debounced paid calculation.
- Explicit `??????` ? `POST /api/financial-documents/{id}/official-calculations/` (and starred equivalent).
- Costs from `TokenWallet.official_calculation_cost` / `starred_calculation_cost`.
- Add uses `calculation_receipt_id` only; no second charge.
- Combined insufficient balance ? compact Persian purchase dialog.
- Company wallet + donation in company settings.

Historical ledger rows that show older ?5 `pricebook_line_usage` entries remain displayable.

## Correction (2026-07-30) ? account settings wallet UX

Personal wallet on `/settings?tab=tokens`: prominent balance + backend calculation costs, compact Persian transaction list (historical `pricebook_line_usage` labeled as historical line charge), packages note while online payment is disabled. No English backend `reason` text in the UI.

## Correction (2026-07-30) ? token packages display + collapsible history

- Token tab shows seeded package cards (5/20/50) as display-only while payments are disabled.
- **Contract gap:** OpenAPI has no `GET` token-package list; catalog is a temporary display mirror of backend seed codes pending a public list endpoint.
- Transaction history is collapsed by default and loads on expand.

## Correction (2026-07-30) ? single personal token badge in shell

- Removed the duplicate account-settings header token button (beside theme toggle).
- Preferred gold chip design (`icon + balance + ????`) lives only in shared `TokenBalanceChip`.
- Desktop `TopHeader`: circular user avatar + chip; click ? `/settings?tab=tokens`.
- Mobile `PrimaryTopBar`: compact chip + avatar; no second body badge on `/settings`.
- Wallet RTK cache (`Wallet:BALANCE`) continues to refresh the same chip after calc / donation / auth.

## Correction (2026-07-30) � demo package purchase

Synced contract includes wallet `commerce` + `token_packages` and `POST /api/payments/demo-purchase/`. Token tab Buy uses server capability; removed hardcoded display catalog. Header chip refreshes via `Wallet:BALANCE` invalidation.

## Correction (2026-07-30) - shared company donation

- Account Token tab action `اهدای توکن به شرکت` opens the same `DonateTokensModal` used by Company Settings.
- Account entry: lists only active memberships; requires selection; auto-preselects when exactly one active company (selector remains visible).
- Company Settings entry: company locked; amount focused; any active member may donate.
- Success invalidates personal + selected company wallets (headers refresh via RTK); exact idempotent replay = one success toast, no duplicate animation.
- No withdrawal / company-to-user transfer UI.

## Correction (2026-07-30) - official item modal Add/calc/insufficient flow

Previous bug: `افزودن` was disabled when `!hasCurrentReceipt` and blocked with "ابتدا محاسبه را انجام دهید…".

Corrected `ItemDetailModal` behavior:

- Opening / editing remains free (no auto or debounced paid calculation).
- Explicit `محاسبه` → official paid endpoint → receipt + backend cost/debit UI; wallets invalidated.
- `افزودن` stays clickable unless document missing/locked or Add/calc is pending (not gated on receipt or cached balance).
- Fresh receipt → line create only; no second charge.
- No fresh/stale receipt → one deliberate `runPaidCalculation` then line create in the same action.
- `INSUFFICIENT_COMBINED_TOKEN_BALANCE` → shared `InsufficientTokenModal` (`توکن کافی نیست` / `خرید توکن` → `/settings?tab=tokens`); form kept; Add remains clickable; no result/receipt/line.
- Starred charging path unchanged in this correction.

## Correction (2026-07-30) - official modal calculation-session auto-calc

Selective cost-report correction only. Unrelated accepted work (color system, wallets, donations, groups, composer, AppShell, etc.) remains intact.

- Restored automatic 500ms official calculation; removed the visible manual `محاسبه` button from official item modals.
- Modal open: `POST .../official-calculation-sessions/` (free) → store `calculation_session_id`; no calculation yet.
- Valid inputs auto-call `POST .../official-calculations/` with session id + idempotency key after 500ms debounce.
- First successful calculation in a session may charge (default 2); later successes in the same session are free (`applied_cost` 0); wallets invalidate only when `applied_cost > 0`.
- Closing/reopening or changing item discards the local session and opens a new one.
- Add stays clickable; with a fresh receipt it creates the line for free; without one it forces an immediate same-session calculation then adds.
- Background 402 insufficient balance stores structured state silently (no dialog/toast flood, no repeated unchanged retries); Add click opens `InsufficientTokenModal` → `/settings?tab=tokens`.
- Pricebook Persian `title_fa` / `short_name_fa` labels preserved; no `Chapter 01` / `Logical item` placeholders.
- Starred modal remains explicit calculate (no official session rule).
