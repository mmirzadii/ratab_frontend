# Frontend Phase 11 Report

Status: **completed** (multi-pricebook correction, 2026-07-31)

## Understanding

Phase 11 integrates the Backend Phase 11 family/year pricebook contract into the existing cost-report Document Info step. The corrected contract allows **one FinancialDocument to contain multiple selected pricebooks** (several families and/or years). This is a Phase 11 correction, not Phase 12.

## Contract sync

- Copied corrected Backend Phase 11 OpenAPI / handoff into `backend_docs/current/` (hashes matched after copy).
- Regenerated OpenAPI types (`npm run generate:api`).
- Spectacular GroupMessage `attachments` typing regression was corrected via `scripts/fix-openapi-group-message.py` before regenerate (generated `schema.ts` not hand-edited).
- Authoritative document field: `selected_pricebooks: FinancialDocumentPricebook[]`.
- Create prefers `pricebook_edition_ids: number[]` (server resolves official price sets).
- Add/remove: `POST/DELETE .../document-pricebooks/`.
- Lines: optional/required `document_pricebook_id` (required when document has more than one selection).
- Legacy singular `pricebook_edition_id` / `price_set_id` retained as primary/first compatibility only.

## Document-information workflow

| Control | Behavior |
| --- | --- |
| `نوع فهرست‌بها` | Family picker (`title_fa`) |
| `سال` | Usable years for that family only; default newest |
| `افزودن` | Adds exact Edition to selected list (chip) |
| Selected list | `نام خانواده — سال` with remove when permitted |

Rules enforced in UI:

- at least one selection required before create;
- duplicate Edition blocked;
- family and year stay separate (no year parsed from labels/codes);
- real Edition IDs only;
- adding does not clear prior picks;
- before create: local draft add/remove;
- after create: backend add/remove; locked documents read-only;
- backend remove errors surfaced (has lines / last selection / locked / stale).

## Existing documents

- Load selections from `selected_pricebooks` (no auto-upgrade to newest year).
- One-pricebook (including migrated) documents keep prior single-edition browse behavior.
- Multi-pricebook documents show all chips; mutate only when backend permits.

## Pricebook browser selector

- Hidden when exactly one selected pricebook.
- When count > 1: compact header selector labeled `نام خانواده — سال`.
- Switching changes **browser context only** (chapters/items); clears chapter/group/item/search/modal; does not rewrite stored selections.
- Active browser selection is reconciled when the document response changes (retain if still present, else first).

## Line requests

- Normal receipt-backed lines include active `document_pricebook_id` when a real selection id is known.
- Starred/custom standalone lines unchanged (may omit selection id).
- Document lines modal shows family/year source when the document has multiple selections.

## State separation

- Persisted: `selected_pricebooks` from FinancialDocument.
- Draft picker: family/year before Add (pre-create draft list).
- Browser: `activeDocumentPricebookId` only.

## Files changed (correction focus)

- `backend_docs/current/*` (corrected Phase 11 sync + GroupMessage OpenAPI fix)
- `src/shared/api/generated/schema.ts` (regenerated)
- `src/features/financialDocuments/financialDocumentApi.ts` (add/remove mutations + line `document_pricebook_id`)
- `src/features/costReports/pricebookFamilyYear.ts` (+ helpers/tests)
- `src/features/costReports/components/DocumentInfoSection.tsx`
- `src/features/costReports/components/PricebookBrowserSection.tsx`
- `src/features/costReports/components/ItemDetailModal.tsx`
- `src/features/costReports/components/DocumentLinesModal.tsx`
- `src/pages/CostReportWizardPage.tsx`
- Phase 11 docs (`REPORT.md`, `TEST_RESULTS.md`, `ACCEPTANCE_MATRIX.md`, `README.md`)

## Validation

- `npm run generate:api` — pass
- `npx tsc -b` — pass
- `npm run test:pricebook-family-year` — pass (21/21)
- `npm run build` — pass

## Remaining limitations

- Local catalog often has only `building/1404`, so live multi-family/multi-year UI checks depend on imported backend data.
- Legacy singular payloads without `selected_pricebooks` are browsable via edition id; synthetic selection id `0` is never sent as `document_pricebook_id`.

Stop after Frontend Phase 11 correction. No commit/push. No Phase 12 folder.
