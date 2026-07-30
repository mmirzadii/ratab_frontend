# Phase 6 Test Results

Date: 2026-07-28  
Environment: local Windows, workspace `d:\work\ratab\ratab_frontend`

## Commands and results

### TypeScript

```text
Command: npx tsc -b --force
Exit code: 0
Result: no diagnostics
```

### Full lint

```text
Command: npm run lint
Exit code: 0
Result:
  generate:api succeeded (openapi-typescript 7.13.0 from backend_docs/current/OPENAPI.yaml)
  eslint . clean
```

### Production build

```text
Command: npm run build
Exit code: 0
Result:
  generate:api succeeded
  tsc -b succeeded
  vite build succeeded (built in ~9.96s)
  Chunk size warnings only (pre-existing large bundles)
```

### Documentation structure validation

```text
Command: npm run validate:docs
Exit code: 0
Result: STATUS: CURRENT_BACKEND_CONTRACT_SYNCED; documentation structure checks passed
```

### Wallet / financial-document / pricebook automated tests

```text
Status: Not run
Reason: package.json has no test / vitest / jest / playwright script or suite.
        No *.test.* / *.spec.* files exist in the frontend repo.
```

Manual checklist for review:

1. Settings page (`/settings`) shows wallet balance and newest-first transactions; refresh button refetches both.
2. Item-detail modal shows the fixed 5-token note when a line can be added; note hidden when the document is locked.
3. Adding an official pricebook line succeeds ? wallet balance/ledger on settings reflects a ?5 `pricebook_line_usage` entry after refetch.
4. With balance < 5, adding a line shows the 402 message with required vs available tokens; retry after an admin grant succeeds without duplicating the line (same idempotency key replayed if payload unchanged).
5. Simulated retry of the exact same payload (e.g. after a network drop) returns HTTP 200 + `Idempotent-Replayed: true` ? success toast says the line already existed and no second token was debited; only one line exists.
6. Starred/custom line creation, calculate, edit, delete, recalculate, lock, preview, and export show no cost UI and cause no charge.
7. Excel bulk import still works; a 402 during bulk submit shows the explicit balance message.
8. Phase 1�5 regression: auth/CSRF, companies, members/groups, messaging, private files, and attachments still work.

## Summary

| Check | Result |
| --- | --- |
| TypeScript | Pass |
| ESLint | Pass |
| Production build | Pass |
| Docs structure validation | Pass |
| Automated wallet/financial-document/pricebook tests | Not available |
| Live wallet/charge QA | Manual / pending reviewer |

---

## Correction (2026-07-30)

The Phase 6 manual checklist items about a fixed **5-token line note** and **?5 line-create debit** are obsolete.

Updated expectations:

1. Opening/editing an item sends no billing request.
2. Explicit `??????` charges current backend official/starred cost and shows billing breakdown.
3. Add uses `calculation_receipt_id` and does not charge again.
4. Combined insufficient funds show personal + company balances and `???? ????`.
5. Historical ?5 ledger rows may still appear for older transactions.

## Correction (2026-07-30) - dual wallet / shared donation validation

| Command | Result |
| --- | --- |
| `npm run generate:api` | Pass (synced OpenAPI from backend frontend_docs) |
| `npm run validate:docs` | Pass (CURRENT_BACKEND_CONTRACT_SYNCED) |
| `npx tsc -b` | Pass (via `npm run build`) |
| `npm run lint` | Pass |
| `npm run test:wallet-donation` | Pass (12) |
| `npm run test:calculation-billing` | Pass (11) |
| `npm run test:token-balance-chip` | Pass (8) |
| `npm run test:account-settings` | Pass (17) |
| `npm run test:wallet-purchase` | Pass (13) |
| `npm run test:text-cleanup` | Pass after removing comment phrase |
| `npm run build` | Pass |
| Live donate before/after balances | Skipped � no local `.env` / authenticated session in this agent run |

## Correction (2026-07-30) - official item modal Add/calc/insufficient flow

| Command | Result |
| --- | --- |
| `npm run generate:api` | Pass |
| `npm run validate:docs` | Pass (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| `npx tsc -b` | Pass (via build) |
| `npm run lint` | Pass |
| `npm run test:calculation-billing` | Pass (23) |
| `npm run test:account-settings` | Pass (17) |
| `npm run build` | Pass |
| Live sufficient / split / company-only / insufficient / Add with & without receipt / purchase nav | Skipped � no authenticated PostgreSQL session in this agent run |

## Official calculation-session auto-calc (2026-07-30)

| Check | Result |
| --- | --- |
| npm run generate:api | Passed |
| npm run test:calculation-billing | Passed — 44 |
| Live item 0201-2 QA | Skipped in this agent run |
