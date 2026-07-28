# Frontend Phase 10 Report

## Summary

Status: done.

This focused Phase 10 follow-up restructured the cost report builder into a clearer five-section workflow: project information, cost report information, pricebook browsing, coefficients, and final review. The existing backend-backed project/document creation, item calculation, line creation, recalculation, HTML preview, backend export, and browser PDF demo behavior remain intact.

## Scope

- Implemented only frontend Phase 10 cost-report builder restructuring.
- Did not touch backend code.
- Did not invent endpoints.
- Did not hardcode backend URLs, database ids, or `price_set_id`.
- Did not change financial calculations or treat missing prices as zero.
- Preserved the existing add-to-cost-report and browser PDF demo flows.

## Files Created

Not applicable.

## Files Modified

- `src/pages/CostReportWizardPage.tsx`
- `code_oder/v0.0/phaze10/REPORT.md`
- `code_oder/v0.0/phaze10/TEST_RESULTS.md`

## Implementation Details

- Added a dedicated builder section model and navigator for:
  - `اطلاعات پروژه`
  - `اطلاعات صورت‌بها`
  - `مرور فهرست‌بها`
  - `ضرایب`
  - `نهایی کردن صورت‌بها`
- Split the old two-step setup/browser flow so project details and document details are separate user-facing screens.
- Locked sections 3, 4, and 5 until a real draft financial document exists.
- Kept document creation on the documented backend flow and still uses `selectedEdition.active_price_set.id` for `price_set_id`.
- Reused existing draft project/document state when returning between sections to avoid duplicate backend records.
- Moved the full document line/totals/preview/export panel into the final review section.
- Added a compact current cost-report summary inside the pricebook browser section.
- Moved coefficient management into its own section and kept the selected coefficient set available for item calculation.
- Added a final-review action that clearly saves/acknowledges the draft state without pretending to call an unavailable official finalization endpoint.

## UI/UX Notes

- The builder now has a left-side section navigator on desktop and compact horizontal navigation on smaller screens.
- Later sections show as disabled until project/document setup is complete.
- The pricebook browser is less cluttered while users choose items.
- Final review is the place for line list, totals, preview, export, browser PDF, and send/attach actions.
- Normal UI does not expose raw `price_set_id` or require `VITE_DEFAULT_PRICE_SET_ID`.

## API Contract Notes

- No API contract changes were made.
- Existing documented endpoints remain in use:
  - project creation;
  - financial document creation;
  - item calculation;
  - financial document line creation;
  - document recalculation;
  - preview/export endpoints already present in the page.
- Official finalization/locking is not faked because no product-approved frontend endpoint was introduced for that in this task.

## Issues and Findings

- The previous implementation was effectively a two-state `setup | browser` page, so coefficients and final review were not first-class workflow steps.
- Official final submission remains a backend/product gap for this frontend phase; the UI now labels the action as draft-state acknowledgement.
- `npm run build` still emits the existing non-blocking Vite chunk-size warning.
- No `npm test` script exists in `package.json`.

### Starred/Manual-Price Limitation (v0.0)

- `PricebookCalculateInputRequest` (v0.0) has only `quantity` and `coefficient_set_id`; **no `manual_unit_price` field**.
- `FinancialDocumentLineCreateRequest` (v0.0) has only `pricebook_item_id` and `quantity`; **no `manual_unit_price` field**.
- Frontend detects starred items via `hasManualUnitPrice(item)` (checks `row.requires_manual_unit_price` and null/blank `unit_price`).
- The UI shows a `قیمت واحد پیشنهادی` input where users can record a proposed price; this is validated (required, positive decimal) but **not sent to the backend** because the v0.0 API contract does not accept it.
- Attempting to calculate or add a starred item shows a clear Persian message explaining the v0.0 limitation; the backend error shape `ManualPriceValidationError` / `ManualPriceLineValidationError` is handled by `getManualPriceValidationMessage`.
- Missing prices are never treated as zero anywhere in the frontend.

## Risks and Assumptions

- Assumed the existing backend-tested create project -> create document -> calculate item -> add line -> recalculate flow remains the source of truth.
- Assumed final official locking/submission belongs to a later backend/API decision.
- Assumed keeping the hidden development fallback code out of the normal flow is acceptable while normal flow uses `active_price_set`.

## User Actions Required

- Manually test the cost report builder from the company dashboard plus/attachment entry point.
- Confirm sections 3, 4, and 5 stay disabled until the draft document is created.
- Confirm project info -> cost report info creates the draft document and opens the pricebook browser.
- Add a calculated item to the cost report, then verify it appears in the final review section.
- Review the coefficient section with an active project and confirm coefficient selection still affects calculation.
- Confirm final review preview/export/browser PDF actions still work as before.

## Suggested Commit Message

fix(frontend-phase10): restructure cost report builder workflow

## Refactor and Maintainability Notes (Phase 10 Continuation)

A subsequent code-quality pass split `src/pages/CostReportWizardPage.tsx` from 3,595 lines into a thin orchestrator (~480 lines) by extracting all types, constants, utilities, and sub-components into the `src/features/costReports/` feature directory. No behavior changes were made.

## Files Split (Refactor Pass)

| New file | Extracted from |
|---|---|
| `src/features/costReports/types.ts` | `CostReportWizardPage.tsx` |
| `src/features/costReports/constants.ts` | `CostReportWizardPage.tsx` |
| `src/features/costReports/costReportUtils.ts` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/BuilderSectionNav.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ItemNotesSections.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/CalculationSection.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ItemDetailModal.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/CurrentDocumentPanel.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ProjectCoefficientPanel.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/ProjectInfoSection.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/DocumentInfoSection.tsx` | `CostReportWizardPage.tsx` |
| `src/features/costReports/components/PricebookBrowserSection.tsx` | `CostReportWizardPage.tsx` |
| `src/shared/utils/apiError.ts` | `CostReportWizardPage.tsx` + `CompanyDashboardPage.tsx` |
| `src/shared/utils/listResults.ts` | `CostReportWizardPage.tsx` + `CompanyDashboardPage.tsx` |
| `src/shared/components/Field.tsx` | `CostReportWizardPage.tsx` |
| `src/shared/components/InfoBox.tsx` | `CostReportWizardPage.tsx` |

Updated files:
- `src/shared/utils/classNames.ts` — added shared `linkButtonClasses` constant
- `src/pages/CostReportWizardPage.tsx` — rewritten as thin orchestrator
- `src/pages/CompanyDashboardPage.tsx` — replaced local duplicate utilities with shared imports

## Behavior Preservation Notes

- All event handlers, state shape, and RTK Query hook calls remain in `CostReportWizardPage.tsx`.
- PDF builder functions (`buildPreviewSrcDoc`, `buildBrowserPdfPrintDoc`) remain inside `CurrentDocumentPanel.tsx` because they require the `B-NAZANIN.TTF?url` Vite asset import.
- The `getApiErrorMessage` fallback message wording may differ slightly for network-error fallbacks in `CompanyDashboardPage.tsx`; the function signature accepts an optional second `fallback` parameter for callers that need a specific message.
- Dead code removed: a `className="hidden"` div containing the old two-step stepper UI (had no observable behavior).

## Next Step

After manual browser review, proceed only with the next approved frontend phase.

---

## Schema v2 Frontend Support Notes

**Status: BLOCKED ON BACKEND.**

`npm run generate:api` was executed and regenerated `src/shared/api/generated/schema.ts` from `backend_docs/history/v0.0/OPENAPI.yaml`. A search for every v2 vocabulary term returned **zero matches**. No feature code was written beyond this diagnostic. The frontend will be implemented in full once the backend YAML exposes the v2 contract.

Item-type detection rule (to be implemented once unblocked):

```
classify(item):
  if schema_version <= 1 or absent   → "single"   (full v1 path, unchanged)
  elif is_itemized == true           → "itemized"
  elif price_ranges present/non-empty → "range-based"
  elif inputs present/non-empty      → "multi-input"
  else                               → "single"
```

This function will live as a single pure export in `src/features/costReports/costReportUtils.ts` so all branches key off one place.

## Multi-input Item Notes

**Status: BLOCKED ON BACKEND** — `inputs[]`, `label_fa`, `unit`, `data_type`, `min_value`/`max_value` per-input, and the `values[]` field in `PricebookCalculateInputRequest` do not exist in the v0.0 contract.

Planned approach (post-unblock):

- Render one labeled numeric field per `inputs[i]` entry, ordered exactly as the contract returns them.
- Label each field with `inputs[i].label_fa`; show `inputs[i].unit` as a suffix.
- Validate each field with the existing `isPositiveDecimal` helper; additionally check `inputs[i].min_value` / `inputs[i].max_value` when non-null.
- On محاسبه, send `values: inputs.map(i => normalizedValue[i.id])` in the calculate body, ordered to match `inputs[]`.
- Reuse existing `inputClasses` styling; no new visual language.

## Itemized Item Notes

**Status: BLOCKED ON BACKEND** — `is_itemized`, `itemized_options` (or equivalent), and a per-option `selected_row_id` do not exist in the v0.0 contract.

Planned approach (post-unblock):

- When `is_itemized` is true, replace the manual row radio picker with a single-select list using the same visual language as the existing row picker (`border-white/10 bg-white/5 hover:bg-white/10` cards with `accent-emerald-400` radio).
- Label each option from the contract's `label_fa` (or equivalent) field.
- Block محاسبه until exactly one option is selected.
- Pass the selected option's row reference in the calculate payload via the contract's defined field name.

## Payload Compatibility Notes

**v1 (today, unchanged, unchanged after this work):**

```
PricebookCalculateInputRequest = {
  quantity: string,
  coefficient_set_id?: number | null,
  manual_unit_price?: string | null,
  pricebook_row_id?: number | null
}

FinancialDocumentLineCreateRequest = {
  pricebook_item_id: number,
  quantity: string,
  manual_unit_price?: string,
  pricebook_row_id?: number
}
```

**v2 additive fields (to be added once contract exists):**

```
PricebookCalculateInputRequest += {
  values?: <type from contract>[],   // ordered to match inputs[]
  selected_row_id?: number           // range-based or itemized resolution
}

FinancialDocumentLineCreateRequest += {
  values?: <type from contract>[],
  selected_row_id?: number
}
```

v2 fields will only be appended when the item is classified as non-single. Every v1 item will produce a byte-for-byte identical payload to today.

## Manual Price Compatibility Notes

Manual / starred unit price is currently blocked at the backend (v0.0 `PricebookCalculateInputRequest` has no `manual_unit_price` field) and will remain blocked until the backend exposes it — regardless of v2 work. The existing frontend validation, UI display, and Persian error messages are preserved and will not be disturbed by v2 work. When the backend adds `manual_unit_price` to the contract (in a future API version), it must be enabled for every item type including multi-input and itemized.

## Backend Dependency Notes

**Exact missing fields after `npm run generate:api` (2025-06-14):**

| Field / Schema | Status |
|---|---|
| `PricebookItemDetail.schema_version` | **MISSING** |
| `PricebookItemDetail.inputs` (array) | **MISSING** |
| `PricebookItemDetail.is_itemized` | **MISSING** |
| `PricebookItemDetail.itemized_options` (or equivalent) | **MISSING** |
| `PricebookItemDetail.price_ranges` (or equivalent) | **MISSING** |
| `PricebookCalculateInputRequest.values` | **MISSING** |
| `PricebookCalculateInputRequest.selected_row_id` | **MISSING** |
| `FinancialDocumentLineCreateRequest.values` | **MISSING** |
| `FinancialDocumentLineCreateRequest.selected_row_id` | **MISSING** |

Source checked: `backend_docs/history/v0.0/OPENAPI.yaml` (the file `generate:api` reads). None of these terms appear anywhere in that YAML.

The fields that ARE present and confirmed unchanged: `requires_row_selection`, `requires_manual_unit_price`, `rows[]`, `unit_price`, `price_status`, `pricebook_row_id`, `quantity`, `coefficient_set_id`.

**Required action before frontend implementation can proceed:** Update `backend_docs/history/v0.0/OPENAPI.yaml` (or the active API version's YAML) to expose all v2 schema fields with their exact names, types, and optionality. Then re-run `npm run generate:api` and re-run this implementation prompt.

## Behavior Preservation Notes

No frontend code was modified in this pass. All v1 items render and calculate identically to the previous phase. `npm run lint` and `npm run build` were not re-run because no files changed; the most recent passing results are recorded in TEST_RESULTS.md (Phase 10 continuation / starred-price pass: both passed, 1670 modules).

---

## Schema v2 Frontend Support (2026-06-14)

**Status: IMPLEMENTED.** The backend YAML was updated before this session; `npm run generate:api` confirmed all v2 fields present. `npm run build` and `npm run lint` both pass (1680 modules).

### Contract Status

All v2 fields now present in `src/shared/api/generated/schema.ts`:

| Field | Schema location | Status |
|---|---|---|
| `schema_version` | `PricebookItemDetail` | ✓ present |
| `value_number` | `PricebookItemDetail` | ✓ present |
| `inputs` (`PricebookItemInputSpec[]`) | `PricebookItemDetail` | ✓ present |
| `price_ranges` | `PricebookItemDetail` | ✓ present (typed `unknown`, runtime shape parsed) |
| `is_itemized` | `PricebookItemDetail` | ✓ present |
| `itemized_options` | `PricebookItemDetail` | ✓ present (typed `unknown`, runtime shape parsed) |
| `values` | `PricebookCalculateInputRequest` | ✓ present |
| `selected_row_id` | `PricebookCalculateInputRequest` | ✓ present |
| `values` | `FinancialDocumentLineCreateRequest` | ✓ present |
| `selected_row_id` | `FinancialDocumentLineCreateRequest` | ✓ present |
| `manual_unit_price` | `PricebookCalculateInputRequest` | ✓ now present (was absent in earlier v0.0) |

### Files Changed

| File | Change |
|---|---|
| `src/features/pricebooks/pricebookApi.ts` | Added `PricebookItemInputSpec` and `PricebookItemRowDetail` type exports |
| `src/features/costReports/types.ts` | Added `PricebookItemType = "single" \| "multi-input" \| "range-based" \| "itemized"` |
| `src/features/costReports/costReportUtils.ts` | Added `parsePriceRanges`, `parseItemizedOptions`, `findMatchedRangeRow` helpers; added `PriceRangesShape`, `ItemizedOptionsShape`, `ItemizedOptionEntry` types; added `classifyPricebookItem` |
| `src/features/costReports/components/CalculationSection.tsx` | Added multi-input form path; added `matchedRangeRow` read-only display; added `rangeMatchError` prop; disabled محاسبه when out of range |
| `src/features/costReports/components/ItemDetailModal.tsx` | Added `classifyPricebookItem` + `useMemo` for matched range row; itemized picker uses `itemized_options` dict (distinct `short_name_fa`); v2 branches in `handleCalculate`/`handleAddLine` |

### Item Type Behavior

| Type | Classify condition | UI | Calculate payload | Line-create payload |
|---|---|---|---|---|
| `single` (v1) | `schema_version ≤ 1` | quantity field | `{quantity}` | `{quantity}` |
| `single` with rows | v1 + `requires_row_selection` | quantity + row picker | `{quantity, pricebook_row_id}` | `{quantity, pricebook_row_id}` |
| `multi-input` | v2 + `inputs.length > 0` | N labeled fields | `{values[]}` | `{quantity (from response), values[]}` |
| `range-based` | v2 + `price_ranges` non-null | quantity/inputs + matched-row banner | `{quantity/values[], selected_row_id}` | `{quantity, values[]?, selected_row_id}` |
| `itemized` | v2 + `is_itemized` | `itemized_options` radio list | `{quantity, selected_row_id}` | `{quantity, selected_row_id}` |

### Backward Compatibility

- V1 items (`schema_version ≤ 1` or field absent): produce byte-for-byte identical payloads to the previous phase.
- `parsePriceRanges` / `parseItemizedOptions` return `null` for any non-conforming shape; classification falls back to `"single"`.
- Null `unit_price` is never displayed as zero or sent as zero.

### Manual Price Compatibility

`manual_unit_price` is now confirmed present in the v0.0 contract for `PricebookCalculateInputRequest`. The existing frontend validation, input field, and Persian error messages work for every item type including multi-input and itemized. (Line-create field was also present.)

### Open Questions

None. All v2 fields are implemented. The `value_number` field in `PricebookItemDetail` is informational (count of inputs) and not directly used by the frontend beyond `inputs.length`.

### Suggested Commit Message

```
feat(frontend-phase10): support schema v2 pricebook items
```
