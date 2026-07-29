# Phase 9 Test Results — Mobile Financial-Document Selector Fix

Date: 2026-07-29

## Automated checks

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| TypeScript (`tsc -b`) | **Passed** |
| `npm run test:company-groups` | **Passed** — 28 tests / 7 suites |
| `npm run test:text-cleanup` | **Passed** — 26 tests / 6 suites |
| `npm run test:company-permissions` | **Passed** — 12 tests |
| `npm run test:project-selector` | **Passed** — 2 tests |
| `npm run build` | **Passed** |

## New tests (mobile sheet + add-button)

13 tests in `groupKinds.test.ts` → "mobile financial-document sheet and add-document behavior":

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
