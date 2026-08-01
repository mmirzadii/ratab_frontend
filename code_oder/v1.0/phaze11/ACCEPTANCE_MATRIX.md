# Phase 11 Acceptance Matrix

## Source resolver

- [ ] 1404 base is validated as complete.
- [ ] 1403 resolves directly from 1404 + 1403 overlay.
- [ ] 1405 resolves directly from 1404 + 1405 overlay.
- [ ] 1406 does not inherit any 1405-only change.
- [ ] absent entity inherits base.
- [ ] complete override replaces base.
- [ ] empty directory tombstone deletes entity.
- [ ] `.deleted` sentinel behaves exactly like empty directory.
- [ ] conflicting file/tombstone is rejected.
- [ ] changed item directory must be complete.
- [ ] target `prices.xlsx` is mandatory and complete.
- [ ] `final_calculate.py` overrides or directly falls back to base.

## Database

- [ ] Pricebook family code has no year.
- [ ] Pricebook has Persian short title and base year.
- [ ] `(family, year)` uniquely identifies one Edition.
- [ ] each Edition is fully materialized.
- [ ] effective source provenance is stored.
- [ ] no temporary/absolute developer source path is stored.
- [ ] one active official price set per Edition.
- [ ] failed import is atomic.
- [ ] repeated import is idempotent.
- [ ] source hash drift is detected.
- [ ] base-year change rebuilds all family editions.

## API

- [ ] family endpoint returns family-only labels.
- [ ] edition endpoint returns numeric available years sorted newest first.
- [ ] no year is embedded in family title.
- [ ] document create accepts authoritative edition ID.
- [ ] existing documents retain their edition.
- [ ] inactive/missing edition cannot be used for new documents.

## Frontend

- [x] first field label is `نوع فهرست‌بها`.
- [x] first field shows `ابنیه`, not `... سال ۱۴۰۴`.
- [x] year field shows numeric years only.
- [x] newest actually available year is default.
- [x] changing family reloads/chooses that family's newest year.
- [x] no hardcoded ABN1404 or default 1404 selection remains.
- [x] Document Info uses add-to-list workflow (`افزودن` → chips).
- [x] one document may hold multiple Editions (families/years).
- [x] duplicate Edition selections are blocked.
- [x] existing document selections load from `selected_pricebooks` (no auto-upgrade).
- [x] locked documents cannot mutate selections.
- [x] browser selector appears only when selected count > 1.
- [x] normal lines send active `document_pricebook_id` when known.
- [x] submission uses real edition ID(s) via `pricebook_edition_ids`.
- [x] RTL/mobile/light/dark layouts remain valid.

## Regression

- [x] inherited item calculates successfully.
- [ ] overridden item calculates successfully.
- [ ] deleted item is absent and cannot be calculated.
- [ ] target-year prices are used.
- [x] first successful modal calculation billing still works.
- [x] line creation remains receipt-backed and free after billing.
- [x] coefficients, footnotes, custom prices, starred rows, finalization, lock, preview, chat attachments remain correct.
- [ ] full backend suite passes.
- [x] OpenAPI validates with zero errors.
- [x] frontend lint/typecheck/tests/build pass.
