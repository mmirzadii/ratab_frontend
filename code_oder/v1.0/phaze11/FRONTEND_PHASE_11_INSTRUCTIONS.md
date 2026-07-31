# Frontend Phase 11 — Separate Pricebook Family and Year Selection

## Purpose

Integrate the Backend Phase 11 family/year contract into the existing Ratab cost-report flow without redesigning unrelated wizard, calculation, billing, document, theme, workspace, or responsive behavior.

The document-information step must present exactly two independent authoritative selections:

1. `نوع فهرست‌بها`
2. `سال`

The first field displays only the Persian family name, such as `ابنیه` or `تأسیسات مکانیکی`. The second displays only numeric available years for that family.

## Read before changing code

Read in order:

1. `AI_CODE_PRINCIPLES.md`
2. `code_oder/COMMON_FRONTEND_CODEX_RULES.md`
3. `code_oder/v1.0/COMMON_FRONTEND_CODEX_RULES.md`
4. `code_oder/active_version.txt`
5. `code_oder/v1.0/PROJECT_EXPLAIN.md`
6. relevant Phase 6, 8, 9, 10 reports
7. every synchronized file under `backend_docs/current/`
8. generated OpenAPI types
9. current pricebook/edition APIs
10. CostReportWizardPage, DocumentInfoSection, default-selection utilities, route-state opening, and FinancialDocument API
11. this Phase 11 instruction and approved decision/spec files.

Run `npm run generate:api` before implementation.

Backend contract and actual live response are authoritative. Do not preserve legacy UI behavior when it contradicts Phase 11.

## Scope

Implement only the family/year selection and required contract/state cleanup.

Preserve:

- project/document wizard sequence;
- calculations and modal-session billing;
- coefficients, footnotes, custom prices and item browser;
- document lines/totals/finalization/locking;
- chat financial-document attachments;
- Corporate Blue light/dark themes;
- desktop/mobile shell;
- all unrelated Phase 9/10 work.

Do not modify backend code.

## Final UI contract

### Family field

Label:

`نوع فهرست‌بها`

Options use only backend family `title_fa`:

```text
ابنیه
تأسیسات مکانیکی
تأسیسات برقی
```

Do not display:

- `فهرست‌بهای واحد پایه رشته ابنیه سال ۱۴۰۴` inside the family select;
- edition title;
- family code;
- legacy code such as `ABN1404`;
- duplicated year.

The selected value is the real family/Pricebook ID or stable generated type expected by the API layer.

### Year field

Label:

`سال`

Options come only from active/current imported editions of the selected family.

Display numeric Solar Hijri year only.

Do not derive years from family title/code.

Do not hardcode `1404`.

Sort descending and select the newest year that actually exists for the chosen family.

“Newest” means maximum available backend edition year, not current date and not base year.

### Selection dependency

When family changes:

1. clear stale edition/year state;
2. load/reuse editions for the new family;
3. select its newest available active year;
4. resolve the exact Edition object/ID;
5. clear any incompatible price-set selection;
6. use that Edition's active official price set.

Prevent race/stale responses when the user switches families quickly.

If a family has no usable edition:

- keep year unselected/disabled;
- show concise Persian error/empty state;
- block Continue/Create;
- do not fall back to another family or hardcoded edition.

## Data and state ownership

Use one source of truth:

- family selection;
- selected Edition derived from family + year;
- selected Edition ID submitted to document create;
- active official price set from the selected Edition.

Do not keep conflicting duplicate state such as family ID, edition title, legacy code, base year, and manual year that can disagree.

Prefer storing selected family ID/code and selected edition ID, deriving displayed year from the selected Edition.

Do not parse IDs/year from strings.

## API integration

Use generated OpenAPI types and current RTK Query endpoints.

Expected flow:

```text
GET /api/pricebooks/
GET /api/pricebooks/{family_id}/editions/
```

Normalize paginated/array responses only through existing shared helpers.

Do not add client-side manifest knowledge or family hardcoding.

Cache editions by family.

Invalidate/refetch only when backend catalog data changes, not on every field render.

## Document creation

Submit the exact selected `pricebook_edition_id`.

Use the selected Edition's valid active official price set according to the backend contract.

Do not submit separate authoritative family/year fields if backend only requires edition ID.

Before submit, verify local consistency:

- selected Edition belongs to selected family;
- displayed year equals Edition.year;
- price set belongs to Edition;
- required title is valid.

Backend remains authoritative.

## Existing document behavior

An existing FinancialDocument keeps its saved Edition forever.

When opening existing draft/locked documents:

- load the saved Edition and family;
- display family and year accurately;
- do not automatically switch to latest year;
- do not replace an inactive historical edition;
- render family/year read-only after document creation;
- preserve current direct-open/chat-attachment flows.

Changing type/year requires a new FinancialDocument.

Do not reset document lines or silently migrate an existing document.

## Create-new flow vs existing flow

### New document

- family field enabled;
- year field enabled after family selection;
- newest actual year defaults;
- selected Edition submitted on create.

### Existing document

- show compact read-only family/year values;
- no editable dropdown that suggests the Edition can change;
- optional explanatory helper only if needed, without clutter.

## Loading/error states

Keep family and edition loading independent.

Required states:

- family list loading/error/empty;
- selected family editions loading/error/empty;
- saved Edition missing/inaccessible;
- no active official price set;
- stale/unavailable Edition rejected by backend.

Use concise Persian errors. Never render raw JSON/HTML/English tracebacks.

Do not show false fallback values.

## Remove legacy logic

Search and remove or correct all assumptions equivalent to:

- `code === "ABN1404"`;
- default Edition year 1404;
- family title containing year;
- parsing year from `code` or `title_fa`;
- deprecated `pricebook_family_code`/`pricebook_persian_name` fallback if no longer in contract;
- `VITE_DEFAULT_PRICE_SET_ID` as normal flow;
- duplicate family/year fields that can disagree;
- legacy default helpers that select building/1404 without backend evidence.

Keep only explicit dev fallback behavior if still documented and gated; it must not override a valid backend active official price set.

## Labels and layout

On desktop keep the current compact three-column form layout where usable.

On mobile keep required fields prominent and optional metadata in the existing disclosure.

Use:

- `عنوان صورت‌بها`
- `نوع فهرست‌بها`
- `سال`

Do not add another heading/card.

Preserve RTL, keyboard, focus, 44px touch targets, no horizontal overflow, light/dark themes.

## Default selection algorithm

For a new document:

1. wait for active families;
2. preserve an explicit valid user selection if present;
3. otherwise select the backend's default family metadata when explicitly provided;
4. otherwise use stable backend sort order / first active family;
5. load that family's editions;
6. select the highest numeric usable year;
7. resolve active official price set.

Do not privilege `building` unless backend explicitly marks it default.

If product currently needs building as default and backend has no default field, report the contract gap rather than silently reintroducing `ABN1404` matching.

## Route state and drafts

Preserve existing route-state behavior for:

- existingProject;
- existingDocument;
- lockProject;
- create-project sheet;
- return from chat attachment.

A transient new-document form draft may preserve family/year selection while navigating wizard sections, but must revalidate against current query data.

Do not persist stale Edition IDs indefinitely in localStorage.

## Tests

Cover every frontend item in `ACCEPTANCE_MATRIX.md`.

At minimum:

### Family display

- family options show short Persian titles only;
- no duplicated year in family options;
- no `ABN1404` visible/mapping authority;
- multiple families render generically.

### Year behavior

- selected family loads only its editions;
- years are numeric and descending;
- newest actually existing year defaults;
- 1404 is not hardcoded;
- family change selects the new family's newest year;
- stale requests cannot overwrite current selection;
- family with no editions blocks create.

### Submission

- exact Edition ID submitted;
- selected price set belongs to Edition;
- mismatch cannot submit;
- backend validation error maps to Persian UI.

### Existing document

- saved family/year display correctly;
- newer year does not replace saved Edition;
- controls are read-only after creation;
- locked and chat-opened documents retain Edition.

### Regression

- project selection/create flow;
- document metadata/dates;
- item browser;
- calculations/billing/Add;
- coefficients/finalize/lock;
- responsive/mobile/light/dark;
- no unrelated Phase 9/10 regressions.

Use real generated response shapes in tests, not outdated hand-written mocks.

## Validation

Run and record:

- `npm run generate:api`
- `npm run validate:docs`
- TypeScript check
- `npm run lint`
- focused family/year tests
- document-info/wizard tests
- existing-document route tests
- pricebook browser/calculation regression tests
- available frontend suite
- `npm run build`

Perform live verification against the Phase 11 backend:

1. new document family options show short Persian names;
2. choose building and confirm available years;
3. newest existing year defaults;
4. switch to another imported family and verify independent years;
5. create a document and verify submitted Edition;
6. reopen and verify family/year are unchanged/read-only;
7. calculate and add an inherited item;
8. test mobile and desktop in both themes.

## Documentation

Update:

- `code_oder/v1.0/PROJECT_EXPLAIN.md`
- `code_oder/v1.0/README.md`
- frontend phase summary;
- every file inside `code_oder/v1.0/phaze11/`.

Document the final fields, selection algorithm, removal of ABN1404/1404 hardcoding, existing-document immutability, and exact API ownership.

Do not modify backend code. Do not fake results. Do not commit or push. Stop after Frontend Phase 11.
