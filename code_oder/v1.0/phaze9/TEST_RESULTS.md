# Phase 9 Test Results ? Mobile Financial-Document Selector Fix

Date: 2026-07-29

## Automated checks

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run test:company-groups` | **Passed** ? 28 tests / 7 suites |
| `npm run test:text-cleanup` | **Passed** ? 26 tests / 6 suites |
| `npm run test:company-permissions` | **Passed** ? 12 tests |
| `npm run test:project-selector` | **Passed** ? 2 tests |
| `npm run build` | **Passed** |

## New tests (mobile sheet + add-button)

13 tests in `groupKinds.test.ts` ? "mobile financial-document sheet and add-document behavior":

1. Portal rendering via `createPortal` + `document.body`
2. Full-screen mobile sheet (`h-dvh w-full`, `fixed inset-0`)
3. Not positioned at bottom-left
4. Background scroll locked
5. Header actions visible with scrollable body
6. Z-index sufficient (`z-[60]`)
7. Validation message when no project selected
8. Opens create-project when no projects exist
9. Empty state has create-project button
10. Linked project opens creation immediately
11. Validation cleared on project selection
12. Message draft preserved via `onSelect` callback
13. Documents loaded after project selection

---

## Calculation-billing correction (2026-07-30)

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| `npm run validate:docs` | **Passed** (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run lint` | **Passed** |
| `npm run test:calculation-billing` | **Passed** ? 10 tests / 2 suites |
| `npm run test:text-cleanup` | **Passed** |
| `npm run build` | **Passed** |
| Manual desktop/mobile QA for Calculate / Add / donation | Pending reviewer with live backend |

---

## Composer auto-resize (2026-07-30)

| Check | Result |
| --- | --- |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run lint` | **Passed** |
| `npm run test:composer-textarea` | **Passed** ? 11 tests / 3 suites |
| `npm run test:company-groups` | **Passed** ? 28 tests / 7 suites |
| `npm run test:text-cleanup` | **Passed** ? 26 tests / 6 suites |
| `npm run build` | **Passed** (`? built in 10.80s`) |

Manual checks (desktop / tablet / ~390px): auto-grow upward, scroll after max, Enter/Shift+Enter, attachment preview, send reset.

## Workspace title dedupe (2026-07-30)

| Check | Result |
| --- | --- |
| `npm run test:company-list-layout` | Passed |
| TypeScript / lint / build | Passed |

## Single shell token balance badge (2026-07-30)

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| `npm run validate:docs` | **Passed** (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run lint` | **Passed** |
| `npm run test:token-balance-chip` | **Passed** ? 6 tests |
| `npm run test:account-settings` | **Passed** ? 17 tests |
| `npm run test:calculation-billing` | **Passed** ? 10 tests |
| `npm run test:company-list-layout` | **Passed** ? 4 tests |
| `npm run build` | **Passed** (`? built in 5.43s`) |

## Conversation activity ordering (2026-07-30)

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| `npm run validate:docs` | **Passed** (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run lint` | **Passed** |
| `npm run test:company-groups` | **Passed** ? 36 tests |
| Other focused frontend tests | **Passed** |
| `npm run build` | **Passed** (`? built in 5.68s`)

## Demo token purchase (2026-07-30)

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| `npm run validate:docs` | **Passed** (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run lint` | **Passed** |
| `npm run test:wallet-purchase` | **Passed** ? 13 tests |
| `npm run test:account-settings` | **Passed** |
| Other focused frontend tests | **Passed** |
| `npm run build` | **Passed** (`? built in 12.38s`) |

## Official item modal Add/calc/insufficient flow (2026-07-30)

| Check | Result |
| --- | --- |
| 
pm run generate:api | **Passed** |
| 
pm run validate:docs | **Passed** (CURRENT_BACKEND_CONTRACT_SYNCED) |
| TypeScript (	sc -b) | **Passed** |
| 
pm run lint | **Passed** |
| 
pm run test:calculation-billing | **Passed** — 23 tests |
| 
pm run test:account-settings | **Passed** — 17 tests |
| 
pm run build | **Passed** |
| Live PostgreSQL billing scenarios | **Skipped** — no authenticated session in this agent run |

## Custom group create route panel (2026-07-30)

| Check | Result |
| --- | --- |
| 
pm run generate:api | **Passed** |
| 
pm run validate:docs | **Passed** (CURRENT_BACKEND_CONTRACT_SYNCED) |
| TypeScript (	sc -b) | **Passed** |
| 
pm run lint | **Passed** |
| 
pm run test:company-groups | **Passed** — 45 tests |
| 
pm run test:text-cleanup | **Passed** — 26 tests |
| 
pm run build | **Passed** |
| Live multi-account invite/accept/reject | **Skipped** — no authenticated dual-session in this agent run |

## Group info side panel redesign (2026-07-30)

| Check | Result |
| --- | --- |
| 
pm run generate:api | **Passed** |
| 
pm run validate:docs | **Passed** |
| TypeScript (	sc -b) | **Passed** |
| 
pm run lint | **Passed** (hooks deps annotated) |
| 
pm run test:company-groups | **Passed** — 52 tests |
| 
pm run build | **Passed** |
| Live multi-account invite/accept | **Skipped** — no dual session in this agent run |

## Metril Corporate Blue color system (2026-07-30)

| Check | Result |
| --- | --- |
| npm run generate:api | Passed |
| npm run validate:docs | Passed (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| TypeScript (`tsc -b` via build) | Passed |
| npm run lint | Passed |
| npm run test:company-groups | Passed — 52 |
| npm run test:text-cleanup | Passed — 26 |
| npm run test:mobile-drawer-nav | Passed — 3 |
| npm run test:token-balance-chip | Passed — 8 |
| npm run test:account-settings | Passed — 17 |
| npm run build | Passed |
| Live light/dark visual QA (1440/1024/768/390) | Skipped in agent run — recommend manual screenshot pass |

## Official calculation-session auto-calc (2026-07-30)

| Check | Result |
| --- | --- |
| npm run generate:api | Passed |
| npm run validate:docs | Passed (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| TypeScript / npm run build | Passed |
| npm run lint | Passed |
| npm run test:calculation-billing | Passed — 44 |
| npm run test:account-settings | Passed — 17 |
| Live PostgreSQL item 0201-2 session/billing QA | Skipped in agent run — backend verified separately (453 tests) |
