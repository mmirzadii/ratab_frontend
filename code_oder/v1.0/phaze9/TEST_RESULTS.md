# Phase 9 Test Results — Selector & Drawer Refinement

Date: 2026-07-29

## Automated checks

| Check | Result |
| --- | --- |
| `npm run generate:api` | **Passed** |
| `npm run validate:docs` | **Passed** — `CURRENT_BACKEND_CONTRACT_SYNCED` |
| TypeScript (`tsc --noEmit` / `tsc -b` via build) | **Passed** |
| `npm run lint` | **Passed** |
| `npm run test:company-groups` | **Passed** — 15 tests |
| `npm run test:auth-password` | **Passed** — 12 |
| `npm run test:invitations` | **Passed** — 15 |
| `npm run test:membership-access` | **Passed** — 11 |
| Playwright E2E | **Not run** — no Playwright toolchain in repo |
| Live browser QA | **Not run** — no authenticated Backend v1 session in agent environment |
| `npm run build` | **Passed** |

## Focused assertions covered

- Selector lists project documents directly; scrollable list region; header `افزودن صورت‌بها`
- Old two-card selector labels/ids absent
- Project lock / public project-select / create-project auto-continue preserved
- Empty list add action shares the same add handler
- Composer, empty-chat, and drawer open the same `FinancialDocumentActionModal` instance
- Drawer tabs exactly: صورت‌بهاها / فایل‌ها / لینک‌ها / اعضا
- Members tab uses `useListCompanyGroupMembersQuery`; stale cancel on group change
- Authorized message-attachment paths; safe link attrs
- No project-attachment action; Persian error mapping / no raw HTML (auth/membership suites)
