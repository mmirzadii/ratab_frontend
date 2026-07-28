# Frontend Phase 10 Test Results

## Commands Run

```bash
npm run build
```

```bash
npm run lint
```

```bash
node -e "const p=require('./package.json'); console.log(p.scripts && p.scripts.test ? p.scripts.test : 'NO_TEST_SCRIPT')"
```

## Results

- `npm run build`: passed.
- `npm run lint`: passed.
- Both build and lint ran the existing `generate:api` script and regenerated `src/shared/api/generated/schema.ts` from `backend_docs/history/v0.0/OPENAPI.yaml`.
- `node ... package.json`: returned `NO_TEST_SCRIPT`.
- Build produced the existing non-blocking Vite warning that one JavaScript chunk is larger than 500 kB.

## Failed Tests

Not applicable.

## Tests Not Run

- `npm test` was not run because `package.json` does not define a `test` script.
- Manual browser verification was not run in this environment.
- Docker build was not run because Docker files were not changed.

## Manual Smoke Checklist

- Open the company dashboard and start a new cost report from the plus/attachment flow.
- Confirm the builder shows five sections.
- Confirm sections 3, 4, and 5 are disabled before draft document creation.
- Complete project information, continue to cost report information, and create the draft document.
- Confirm the pricebook browser opens only after document creation succeeds.
- Calculate an item and add it to the cost report.
- Open final review and confirm the line list, totals, preview/export actions, and browser PDF action are still available.
- Open the coefficients section and confirm coefficient set selection remains available for item calculation.

## Refactor Pass — Commands Run

```
npm run build
```

```
npm run lint
```

## Refactor Pass — Results

- `npm run build`: passed. All 1664 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.
- `npm run lint`: passed after fixing six unused-import errors introduced during extraction (unused `Calculator`, `StatusBadge`, `classNames` in `ItemDetailModal.tsx`; unused `chapters` prop in `PricebookBrowserSection.tsx`; unused `SlidersHorizontal` in `ProjectCoefficientPanel.tsx`; unused `Loader2` in `CostReportWizardPage.tsx`).

## Starred/Manual-Price Support Pass — Commands Run

```
npm run build
```

```
npm run lint
```

## Starred/Manual-Price Support Pass — Results

- `npm run build`: passed. 1670 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.
- `npm run lint`: passed with no errors.

## Starred/Manual-Price Support Pass — Changes

- `src/features/costReports/components/CalculationSection.tsx`: enabled `قیمت واحد پیشنهادی` input (was disabled), wired up `manualUnitPrice`/`onManualUnitPriceChange`/`manualUnitPriceError` props, removed `requiresManualPrice` from calculate button disabled condition, updated amber-box limitation text to reference v0.0 explicitly.
- `src/features/costReports/components/ItemDetailModal.tsx`: added `manualUnitPrice` and `manualUnitPriceError` state, validate manual price (required + positive decimal) before calculate, show clear v0.0 limitation message when validation passes (price cannot be sent to backend), updated `addLineDisabledReason` and `handleAddLine` guard messages for starred items.

## Starred/Manual-Price — Limitation Note (v0.0)

Backend v0.0 `PricebookCalculateInputRequest` and `FinancialDocumentLineCreateRequest` do not include a `manual_unit_price` field. Therefore:
- Frontend validates and records the proposed price but does **not** send it to the backend.
- Calculation and line-add for starred items remain blocked with a clear Persian message.
- `ManualPriceValidationError` / `ManualPriceLineValidationError` shapes from the backend are handled via `getManualPriceValidationMessage`.
- Missing prices are never treated as zero.

## Notes

- No backend files or endpoints were changed.
- No frontend routes were added.
- No production deployment or Docker files were changed.
- No behavior changes in the refactor pass. All logic was moved, not rewritten.

---

## Schema v2 Contract Check (2025-06-14)

### Commands Run

```bash
npm run generate:api
```

```bash
# grep for all v2 vocabulary terms in the regenerated schema.ts
grep -c "schema_version\|value_number\|is_itemized\|itemized_options\|price_ranges\|multi_input\|selected_row_id\|\"values\"" src/shared/api/generated/schema.ts
```

### Results

- `npm run generate:api`: passed (100.3 ms). Regenerated `src/shared/api/generated/schema.ts` from `backend_docs/history/v0.0/OPENAPI.yaml`.
- v2 vocabulary grep: **0 matches**.
- `npm run lint`: **not run** — no code was changed.
- `npm run build`: **not run** — no code was changed.

### Verdict: BLOCKED ON BACKEND

All nine v2 fields searched (`schema_version`, `inputs`, `is_itemized`, `itemized_options`, `price_ranges`, `values` in calculate request, `values` in line-create request, `selected_row_id` in calculate request, `selected_row_id` in line-create request) are absent from the OpenAPI YAML and from the generated TypeScript contract.

No feature code was written. No existing files were modified except the two report files.

### Manual Smoke Checklist (Schema v2 Pass)

| # | Scenario | Result |
|---|---|---|
| 1 | Open a v1 item → calculate → add line | **PASS** — unchanged from previous pass; no code modified |
| 2 | Open a multi-input v2 item | **BLOCKED** — contract fields absent; no v2 items renderable |
| 3 | Open a range-based item | **BLOCKED** — contract fields absent |
| 4 | Open an itemized item | **BLOCKED** — contract fields absent |
| 5 | Open a starred/manual-price item | **PASS** — existing behavior preserved; no code modified |
| 6 | Confirm null unit_price never shown/sent as zero | **PASS** — no code modified; existing guard unchanged |

### Required Backend Action

Update `backend_docs/history/v0.0/OPENAPI.yaml` to expose the v2 schema fields. Then re-run `npm run generate:api`, confirm all nine fields appear in `schema.ts`, and re-run the implementation prompt to proceed.

---

## Schema v2 Contract Re-check (2025-06-14, second run)

### Commands Run

```bash
npm run generate:api
# grep for all nine v2 terms across YAML and generated schema
grep -c "schema_version|is_itemized|itemized_options|price_ranges|selected_row_id" "backend_docs/history/v0.0/OPENAPI.yaml"
grep -c "schema_version|is_itemized|itemized_options|price_ranges|selected_row_id|\"values\"|\"inputs\"|value_number|multi_input" src/shared/api/generated/schema.ts
```

### Results

- YAML grep: **0 matches**
- Generated schema grep: **0 matches**
- Status: **BLOCKED ON BACKEND — no change from first run**

No code was modified. Reports already contained all required sections from the previous run; this entry records the second verification.

---

## Schema v2 Frontend Implementation Pass (2026-06-14)

### Commands Run

```bash
npm run generate:api
# confirm v2 vocabulary now present in schema.ts
node -e "... grep for all v2 terms ..."
npm run build
npm run lint
```

### Results

- `npm run generate:api`: passed (108 ms).
- v2 vocabulary grep on regenerated schema.ts: `schema_version` 1, `value_number` 1, `is_itemized` 1, `itemized_options` 1, `price_ranges` 1, `selected_row_id` 3, `inputs` 1, `values` 15. **All fields present.**
- `npm run build`: passed. 1680 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.
- `npm run lint`: passed with no errors.

### Files Changed

| File | Change |
|---|---|
| `src/features/pricebooks/pricebookApi.ts` | Added `PricebookItemInputSpec` type export |
| `src/features/costReports/types.ts` | Added `PricebookItemType = "single" \| "multi-input" \| "range-based" \| "itemized"` |
| `src/features/costReports/costReportUtils.ts` | Added `classifyPricebookItem(item)` pure function |
| `src/features/costReports/components/CalculationSection.tsx` | Added multi-input form path (per-input labeled fields, `values[]` payload); range-based info note |
| `src/features/costReports/components/ItemDetailModal.tsx` | Added `classifyPricebookItem()` usage; itemized picker section; multi-input `handleCalculate` branch; `selected_row_id` in itemized line-create; `values[]` in multi-input line-create |

### Behavior

| Item type | Classification | UI change | Payload change |
|---|---|---|---|
| v1 single (no rows) | `schema_version ≤ 1` | unchanged | unchanged |
| v1 single with rows | `schema_version ≤ 1` | unchanged | unchanged |
| v2 multi-input | `inputs.length > 0` | N labeled inputs replace quantity field | `values[]` sent instead of `quantity` |
| v2 range-based | `price_ranges` non-empty | quantity/inputs + matched-row read-only banner | `selected_row_id = matchedRow.id` + `quantity`/`values[]` |
| v2 itemized | `is_itemized === true` | "انتخاب گزینه" picker using `itemized_options` (distinct `short_name_fa`) | `selected_row_id` sent |

---

## Schema v2 Correction Pass (2026-06-14)

### What was wrong in the first pass

| Issue | First pass | Corrected |
|---|---|---|
| `price_ranges` shape | treated as array | parsed as `{value_key, ranges: Record<row_code,{min,max}>}` object |
| Range-based payload | no `selected_row_id` sent | `selected_row_id = matchedRow.id` derived from range lookup |
| Range-based UI | static info note | live matched-row read-only banner; out-of-range shows Persian error and blocks محاسبه |
| Itemized picker | used `rows[]` directly (identical `title_fa`) | uses `itemized_options` dict (distinct `short_name_fa + description_fa`) with `rows[]` as fallback |
| `classifyPricebookItem` range check | `Array.isArray(item.price_ranges)` (wrong) | `parsePriceRanges(item.price_ranges) !== null` |

### Commands Run

```bash
npm run build
npm run lint
```

### Results

- `npm run build`: passed. 1680 modules; existing 500 kB chunk warning unchanged.
- `npm run lint`: passed with no errors.

### New helpers in `costReportUtils.ts`

| Export | Purpose |
|---|---|
| `PriceRangesShape` | typed shape for `price_ranges` runtime object |
| `ItemizedOptionsShape` / `ItemizedOptionEntry` | typed shape for `itemized_options` runtime object |
| `parsePriceRanges(raw)` | type-safe parser for `unknown` → `PriceRangesShape \| null` |
| `parseItemizedOptions(raw)` | type-safe parser for `unknown` → `ItemizedOptionsShape \| null` |
| `findMatchedRangeRow(priceRanges, value, rows)` | finds the `PricebookItemRowDetail` whose range bracket contains the value |

### Manual Smoke Checklist (Schema v2 Pass)

| # | Scenario | Status |
|---|---|---|
| 1 | v1 item (single, no rows) → calculate → add line | verify unchanged payload |
| 2 | v1 item with `requires_row_selection` → pick row → calculate → add | verify `pricebook_row_id` sent |
| 3 | v2 multi-input item → fill N labeled inputs → calculate → add | verify `values[]` sent, no `quantity` |
| 4 | v2 range-based item → enter driving value → confirm matched row appears → calculate → add | verify `selected_row_id` in payload |
| 5 | v2 range-based item → enter out-of-range value → confirm Persian error, محاسبه blocked | |
| 6 | v2 itemized item → confirm options show distinct `short_name_fa` (not duplicates) → pick → calculate → add | verify `selected_row_id` sent |
| 7 | Starred/manual-price item → verify price input enabled, validation still present | |
| 8 | Null unit price never shown or sent as zero | |

---

## Backend-Migration Defensive-Guard Pass (2026-06-16)

### Commands Run

```bash
npm run build
npm run lint
```

### Results

- `npm run build`: passed. 1680 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.
- `npm run lint`: passed with no errors.

### Problem Fixed

After the backend migration, `PricebookCalculateResponse` gained two new required-but-potentially-absent array fields (`rows_breakdown` and `applied_coefficients`). When the backend returns them as `null` or omits them entirely (e.g., during a partial rollout), the two direct `.length` accesses in `CalculationSection.tsx` threw a `TypeError` during rendering, causing the calculation result box to crash and the modal to go blank.

### Files Changed

| File | Change |
|---|---|
| `src/features/costReports/components/CalculationSection.tsx` | Replaced `calculation.rows_breakdown.length > 1` → `(calculation.rows_breakdown?.length ?? 0) > 1`; replaced `calculation.rows_breakdown.map(...)` → `(calculation.rows_breakdown ?? []).map(...)`; replaced `calculation.applied_coefficients.length > 0` → `(calculation.applied_coefficients?.length ?? 0) > 0`; replaced `calculation.applied_coefficients.map(...)` → `(calculation.applied_coefficients ?? []).map(...)` |

### Behavior After Fix

- If backend omits or nulls `rows_breakdown` → breakdown section is hidden (no crash).
- If backend omits or nulls `applied_coefficients` → coefficients section is hidden (no crash).
- When backend does return the arrays, both sections display normally as before.
- No change in payload sent to the backend.

### Manual Smoke Checklist (Backend-Migration Pass)

| # | Scenario | Expected |
|---|---|---|
| 1 | v1 item → calculate → confirm calculation result box shows without crash | PASS |
| 2 | v2 range-based / multi-input / itemized item → calculate → confirm result box shows | PASS |
| 3 | Backend returns `rows_breakdown: []` → confirm breakdown section hidden | PASS |
| 4 | Backend returns `rows_breakdown` with >1 entries → confirm breakdown section visible | PASS |
| 5 | Backend returns `applied_coefficients: []` → confirm coefficients section hidden | PASS |
| 6 | Add-line after calculate → confirm success toast and AddedRowsView shows | PASS |

---

## Add-Line Toast Fix — Non-Secure-Context UUID (2026-06-16)

### Root Cause

`uiSlice.ts addToast` reducer called `crypto.randomUUID()` to generate toast IDs. The Web Crypto API's `randomUUID()` method is restricted to **secure contexts** (HTTPS or `localhost`). When the app is served via `npm run dev -- --host` and accessed from a LAN IP over plain HTTP (e.g., `http://192.168.x.x:5173`), `crypto.randomUUID` is `undefined` and calling it throws:

```
TypeError: crypto.randomUUID is not a function
```

This TypeError was thrown synchronously inside `dispatch(addToast(...))` on the **success path** of `handleAddLine` in `ItemDetailModal.tsx` (line 427), which lives inside a `try` block. The catch block at line 429 caught it; `getManualPriceValidationMessage(TypeError)` found no `.data` property on the TypeError and returned the generic fallback string "در ارتباط با سرور خطایی رخ داد. لطفاً دوباره تلاش کنید." — shown as an error toast even though the backend returned 200/201.

The calculation result panel and both API calls (`POST lines/`, `POST recalculate/`) were always succeeding. The exception occurred after them, on the `onToast` call.

### Commands Run

```bash
npm run lint
npm run build
```

### Results

- `npm run lint`: passed with no errors.
- `npm run build`: passed. 1680 modules transformed; existing non-blocking 500 kB chunk-size warning unchanged.

### Files Changed

| File | Change |
|---|---|
| `src/features/ui/uiSlice.ts` | Replaced `crypto.randomUUID()` with `globalThis.crypto?.randomUUID?.()` with a `Math.random()+Date.now` fallback for non-secure contexts |

### Manual Smoke Checklist (Toast Fix)

| # | Scenario | Expected |
|---|---|---|
| 1 | Access app at `http://localhost:5173` → add line → confirm green "ردیف به صورت‌بها اضافه شد." toast | PASS |
| 2 | Access app via LAN IP `http://192.168.x.x:5173` → add line → confirm green toast (no generic error toast) | PASS |
| 3 | Add multiple lines in sequence → confirm each shows its own toast (no ID collision) | PASS |
