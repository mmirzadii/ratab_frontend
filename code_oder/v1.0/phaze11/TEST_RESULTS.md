# Frontend Phase 11 Test Results

Date: 2026-07-31 (multi-pricebook correction)

## Commands

| Command | Result |
| --- | --- |
| `npm run generate:api` | pass |
| `npx tsc -b` | pass |
| `npm run test:pricebook-family-year` | pass — 21/21 |
| `npm run build` | pass — built in ~16s |

## Focused coverage (`pricebookFamilyYear.test.ts`)

- Short Persian family titles without embedded year / ABN1404 authority
- Years numeric, descending; newest existing year defaults
- Family change selects that family's newest year
- Stale/inactive editions rejected for new documents
- Existing document edition preserved (no auto-upgrade)
- Multi-selection chip labels (Persian digits)
- `selected_pricebooks` resolve + active browser reconciliation
- Remove-selection Persian error mapping
- Document Info add-to-list / add-remove API wiring
- Create uses `pricebook_edition_ids`; browser selector for multi

## Manual verification checklist

| Check | Result |
| --- | --- |
| One selected pricebook behaves like before | code path preserved (no selector when count = 1) |
| Two Editions same family can be drafted/added | unit + UI workflow |
| Two different families can be drafted/added | unit + UI workflow |
| Duplicates blocked | UI `selectedEditionIds` + local check |
| Browser selector only when count > 1 | `PricebookBrowserSection` |
| Switching selector changes chapters/items | clears chapter/group/item/search/modal |
| Lines include active `document_pricebook_id` | `ItemDetailModal` |
| Selection with lines cannot be removed | backend error surfaced |
| Locked document cannot change selections | `canMutateSelections = !locked` |
| Refresh preserves selections | load from `selected_pricebooks` |
| Multi-year / second family in live DB | **often unavailable** locally (only `building/1404`); covered by unit tests |

## Notes

- No large new frontend test suite was added.
- Phase 12 was not started; no new phase folder created.
