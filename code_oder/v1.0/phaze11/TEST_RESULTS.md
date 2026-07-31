# Frontend Phase 11 Test Results

Date: 2026-07-31

## Commands

| Command | Result |
| --- | --- |
| `npm run generate:api` | pass |
| `npm run validate:docs` | pass — `CURRENT_BACKEND_CONTRACT_SYNCED` |
| `npx tsc -b` | pass |
| `npm run lint` | pass |
| `npm run test:pricebook-family-year` | pass — 18/18 |
| `npm run test:project-selector` | pass — 2/2 |
| `npm run test:calculation-billing` | pass — 44/44 |
| `npm run build` | pass — built in ~12.4s |

## Focused coverage (`pricebookFamilyYear.test.ts`)

- Short Persian family titles without embedded year / ABN1404 authority
- Years numeric, descending; newest existing year defaults
- Family change selects that family's newest year
- Stale/inactive editions rejected for new documents
- Existing document edition preserved (no auto-upgrade)
- Edition/family/price-set consistency + Persian create error mapping
- Route-rendered `CostReportWizardPage` / `DocumentInfoSection` wiring

## Live UI checks

| Check | Result |
| --- | --- |
| Desktop new document: `نوع فهرست‌بها` = ابنیه | pass |
| Year = 1404 (only available), not title-parsed | pass |
| Create submits selected edition | pass (browser → pricebook chapters) |
| Existing document family/year read-only | pass |
| Multi-year / second family in live DB | **not available** in local catalog (only `building/1404`); covered by unit tests |
| Mobile/light/dark full matrix | layout preserved (no redesign); spot-check desktop light/dark via existing theme toggle not separately re-run this phase |

## Notes

- Pre-existing unrelated wallet donation chip color test failures from earlier work were not part of this phase’s focused suite.
- OpenAPI GroupMessage attachments spectacular typing was corrected in `backend_docs/current/OPENAPI.yaml` before regenerate so Phase 10 messaging types typecheck.
