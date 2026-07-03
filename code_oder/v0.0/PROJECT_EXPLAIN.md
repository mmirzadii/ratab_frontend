# Ratab Frontend Project Explain - v0.0

Last updated: 2026-07-03
Active version file: `code_oder/active_version.txt`
Current active version: `v0.0`
Documentation root note: the repository currently uses `code_oder` as the folder name. Do not rename it to `code_order` unless the project owner explicitly asks for a migration.

## Purpose

This file is the onboarding document for any AI or developer that needs to understand the Ratab frontend without guessing from scattered phase reports.

Before changing code, read these files in this order:

1. `code_oder/active_version.txt`
2. `code_oder/<active-version>/PROJECT_EXPLAIN.md`
3. `AI_CODE_PRINCIPLES.md`
4. `backend_docs/v0.0/frontend_handoff_v0_0.md`
5. `backend_docs/v0.0/ratab v0.0 Backend API.yaml`
6. The local source files related to the requested change.

After every frontend update, update this file if the behavior, structure, API usage, routes, state, or known limitations changed.

## Product Snapshot

The product is a Persian-first, RTL construction cost-reporting frontend. The principles file names the product `ratab / رتب`, while many current UI strings still show the earlier brand `Metril / متریل`. Treat this as a known branding inconsistency in v0.0. Do not introduce a third brand name.

The current user journey is:

1. Public landing page.
2. Dev phone login.
3. Protected company list.
4. Company creation.
5. Company dashboard with local messages, company info, projects, and cost report attachments.
6. Cost report builder:
   - select project,
   - create or open financial document,
   - manage coefficients,
   - browse pricebook chapters/groups/items,
   - calculate item,
   - add lines to financial document,
   - preview/export through browser print,
   - lock/finalize the document.

The frontend must not be the authoritative financial calculator. It sends calculation input to the backend and displays backend totals.

## Technology

Runtime and build stack:

- React 19
- TypeScript 5.7
- Vite 6
- React Router 7
- Redux Toolkit
- RTK Query
- Tailwind CSS 3
- lucide-react icons
- Vazirmatn web font through `@fontsource/vazirmatn`
- `react-multi-date-picker` for Jalali date input
- `three` and `gsap` for the login page visual effects
- `xlsx` for the unfinished Excel import modal
- `openapi-typescript` for generated backend schema types

Package scripts in `package.json`:

- `npm run dev`: generates API types, then starts Vite.
- `npm run build`: generates API types, runs `tsc -b`, then builds Vite.
- `npm run lint`: generates API types, then runs ESLint.
- `npm run preview`: serves the built Vite output.
- `npm run generate:api`: reads `backend_docs/v0.0/ratab v0.0 Backend API.yaml` and writes `src/shared/api/generated/schema.ts`.

Important: `src/shared/api/generated/schema.ts` is generated. Do not hand-edit it unless the task is explicitly about a temporary generated-schema patch.

## Runtime Environment

Environment variables:

- `VITE_API_BASE_URL`: base API URL. `src/shared/api/baseApi.ts` trims a trailing slash. If empty, API calls are relative to the frontend origin.
- `VITE_DEFAULT_PRICE_SET_ID`: deprecated development fallback used only by `getDeprecatedConfiguredPriceSetId()` when no active backend price set exists and the user explicitly confirms the dev override in the document step.

Do not hardcode backend URLs in React components. Use `VITE_API_BASE_URL`.

Token storage:

- Token key: `ratab.devAuth.token`
- Storage: `window.sessionStorage`
- Header: `Authorization: Token <token>`

UI persistence:

- Theme: `metril.theme` in `localStorage`, with backward read fallback from `ratab.theme`.
- Onboarding dismissed state: user-scoped `metril.onboarding.dismissed.<user-key>`.
- Guided tour completion flags: `tour_seen_companies`, `tour_seen_company_dashboard`, `tour_seen_wizard`, `tour_seen_finalize`.

## Repository Map

Top-level files and folders:

- `src/`: application source.
- `src/app/`: app composition, router, Redux store, typed hooks, shell context.
- `src/pages/`: route-level pages.
- `src/features/`: domain modules and RTK Query APIs.
- `src/shared/`: reusable components, API base, generated schema, utilities.
- `src/styles/index.css`: global Tailwind entry and RTL/light-theme CSS.
- `backend_docs/v0.0/`: OpenAPI and backend handoff documents.
- `code_oder/`: AI/Codex instructions, phase reports, active version file, project explanations.
- `docker/frontend/`: static nginx container files for online dev/demo deployment.
- `dist/`: build output, not a source of truth.
- `node_modules/`: installed dependencies, not a source of truth.

## Boot Flow

Entry point:

- `src/main.tsx` imports Vazirmatn font weights, global CSS, creates React root, and renders `<AppProviders />` in `StrictMode`.

Providers:

- `src/app/providers.tsx` wraps the app with Redux `<Provider>` and `<AppShellProvider>`.

App component:

- `src/app/App.tsx` reads `ui.theme`, `ui.hasDismissedOnboarding`, and `auth.user`.
- It calls `usePersistedUiState()` to set `html.lang = fa`, `html.dir = rtl`, `data-theme`, dark class, and onboarding persistence.
- It renders `RouterProvider` with `router`.

Router:

- `src/app/router.tsx` owns route definitions.
- Public:
  - `/`: `RootPage`
  - `/login`: `LoginPage`
  - `/status`: `AppShell` + `HealthStatusPage`
- Protected by `RequireAuth` + `AppShell`:
  - `/dashboard`: redirects to `/companies`
  - `/companies`: `CompanyListPage`
  - `/companies/new`: `CompanyCreatePage`
  - `/companies/:companyId`: `CompanyDashboardPage`
  - `/companies/:companyId/cost-reports/new`: `CostReportWizardPage`
  - `/help`: `HelpPage`
  - `/settings`: `AccountSettingsPage`

Unused/not routed:

- `src/pages/DashboardPreviewPage.tsx` exists from earlier phases but is not in the router.
- `src/features/costReports/components/ProjectInfoSection.tsx` exists but is not used by `CostReportWizardPage`.
- `src/features/costReports/excelImport/ExcelImportWizardModal.tsx` exists but is not wired into the current UI.

## Redux Store

`src/app/store.ts` configures:

- `auth`: from `features/auth/authSlice.ts`
- `ui`: from `features/ui/uiSlice.ts`
- `ratabApi`: from `shared/api/baseApi.ts`

RTK Query middleware is added and `setupListeners(store.dispatch)` is enabled.

Typed hooks:

- `useAppDispatch`
- `useAppSelector`

These live in `src/app/hooks.ts` and should be used instead of raw `useDispatch` and `useSelector`.

## App Shell Context

`src/app/appShellContext.tsx` is a local React context used by pages to control the global shell.

Context fields:

- `secondaryNav`: optional sidebar items shown in desktop secondary nav and mobile drawer.
- `secondaryNavVariant`: `emerald` for company dashboard, `violet` for cost report wizard.
- `companyCtx`: current company name/status used by headers and nav.
- `wizardCtx`: wizard title, company name, next/back/finalize callbacks, and button state.

Pages must clean up context in `useEffect` cleanup when leaving route. Existing company dashboard and wizard already do this.

## API Layer

Base API:

- File: `src/shared/api/baseApi.ts`
- `createApi` reducer path: `ratabApi`
- Base URL: `VITE_API_BASE_URL`, trimmed.
- Auth: reads token from `sessionStorage` and sets `Authorization: Token <token>`.
- Tag types: `Auth`, `Coefficient`, `Company`, `FinancialDocument`, `Health`, `Pricebook`, `Project`.

All feature APIs inject endpoints into this shared `baseApi`.

### Auth API

File: `src/features/auth/authApi.ts`

Endpoints:

- `POST /api/auth/dev-login/` through `useDevLoginMutation`
- `GET /api/auth/me/` through `useGetCurrentUserQuery`

Auth slice:

- File: `src/features/auth/authSlice.ts`
- State:
  - `token`
  - `user`
  - `shouldHighlightCreateCompany`
- Actions:
  - `setDevLoginSession`
  - `setCurrentUser`
  - `clearCreateCompanyHighlight`
  - `logout`

`RequireAuth`:

- File: `src/features/auth/RequireAuth.tsx`
- Redirects unauthenticated users to `/login`.
- Calls `auth/me` when token exists.
- Logs out if `auth/me` errors.

### Company API

File: `src/features/companies/companyApi.ts`

Endpoints:

- `GET /api/companies/`
- `POST /api/companies/`
- `GET /api/companies/{companyId}/`
- `PATCH /api/companies/{companyId}/`

Types come from generated OpenAPI components:

- `Company`
- `CompanyRequest`
- `PatchedCompanyRequest`
- `PaginatedCompanyList`

### Project API

File: `src/features/projects/projectApi.ts`

Endpoints:

- `GET /api/companies/{companyId}/projects/`
- `POST /api/companies/{companyId}/projects/`

The list response is normalized because backend responses can be array-like or paginated.

### Pricebook API

File: `src/features/pricebooks/pricebookApi.ts`

Endpoints:

- `GET /api/pricebooks/`
- `GET /api/pricebooks/{pricebookId}/editions/`
- `GET /api/pricebook-editions/{editionId}/chapters/`
- `GET /api/pricebook-chapters/{chapterId}/groups/`
- `GET /api/pricebook-items/?chapter_id=&edition_id=&group_id=&q=`
- `GET /api/pricebook-items/{itemId}/`
- `POST /api/pricebook-items/{itemId}/calculate/`

The item list query builds query parameters with `URLSearchParams`. Preserve row codes as strings and never convert leading-zero codes to numbers.

`PricebookCalculateInputPayload` locally extends the generated calculate request with optional `custom_prices: Record<string, string>` until the OpenAPI schema includes that runtime-supported field.

### Coefficient API

File: `src/features/coefficients/coefficientApi.ts`

Endpoints:

- `GET /api/projects/{projectId}/coefficient-sets/`
- `POST /api/projects/{projectId}/coefficient-sets/`
- `GET /api/coefficient-sets/{setId}/values/`
- `POST /api/coefficient-sets/{setId}/values/`
- `PATCH /api/coefficient-values/{valueId}/`
- `DELETE /api/coefficient-values/{valueId}/`

Current UI only creates project-scope coefficient values. Chapter and row scope types exist in types/constants but are not fully exposed in the current form.

### Financial Document API

File: `src/features/financialDocuments/financialDocumentApi.ts`

Endpoints:

- `GET /api/projects/{projectId}/financial-documents/`
- `POST /api/projects/{projectId}/financial-documents/`
- `GET /api/financial-documents/{documentId}/`
- `PATCH /api/financial-documents/{documentId}/`
- `POST /api/financial-documents/{documentId}/lines/`
- `PATCH /api/financial-document-lines/{lineId}/`
- `DELETE /api/financial-document-lines/{lineId}/`
- `POST /api/financial-documents/{documentId}/recalculate/`
- `POST /api/financial-documents/{documentId}/lock/`
- `GET /api/financial-documents/{documentId}/preview/`
- `POST /api/financial-documents/{documentId}/exports/`
- `GET /api/financial-document-exports/{exportId}/download/`
- `POST /api/financial-documents/{documentId}/excel-plan/`
- `POST /api/financial-documents/{documentId}/lines/bulk/`

Not all hooks are wired into visible UI. The current final preview uses a locally generated official-form HTML string in `CurrentDocumentPanel`, not the `retrieveFinancialDocumentPreview` hook.

Local payload extensions in `financialDocumentApi.ts` currently cover backend fields that are supported at runtime but not yet fully modeled by the v0.0 OpenAPI schema:

- `custom_prices: Record<string, string>` for pricebook line creation.
- Standalone starred/custom line creation with `line_source: "starred"`, `title_fa`, `description_fa`, `unit`, `quantity`, and `manual_unit_price`.

Keep these extensions isolated in the feature API file until the generated schema includes the same fields.

### Health API

File: `src/features/health/healthApi.ts`

Endpoint:

- `GET /api/health/`

Used by `/status`.

## UI Shell And Navigation

`src/shared/components/AppShell.tsx` is the protected app frame:

- Desktop:
  - fixed primary nav on the right (`PrimaryNav`)
  - optional secondary nav beside it (`SecondaryNav`)
  - content gets `lg:pr-20` or `lg:pr-[19rem]`
- Mobile:
  - fixed `PrimaryTopBar`
  - slide-out `MobileDrawer`
  - optional secondary panel inside drawer
- Always includes:
  - `ContextHeader`
  - `GuidedTour`
  - `ToastContainer`

Primary nav items:

- companies list
- create company
- help
- account settings
- logout
- theme toggle

Secondary nav:

- Driven by page via `useAppShell`.
- Company dashboard uses emerald style.
- Cost report wizard uses violet style.

Context header:

- If `wizardCtx` exists, shows wizard back/next/finalize controls.
- Else if `companyCtx` exists, shows company name/status and back to companies.
- Else shows generic `TopHeader`.

## Pages

### Landing Page

File: `src/pages/LandingPage.tsx`

Public marketing/demo page. Shows feature cards and workflow. CTA goes to `/login` unless a token exists, then `/companies`.

Current branding in this page is `Metril`, not `Ratab`.

### Root Page

File: `src/pages/RootPage.tsx`

If token exists, redirects to `/companies`; otherwise renders `LandingPage`.

### Login Page

File: `src/pages/LoginPage.tsx`

Flow:

1. User enters phone.
2. Phone is normalized with `normalizeNumberInput`.
3. User optionally enters display name.
4. Calls `devLogin`.
5. Stores token and user in Redux/sessionStorage.
6. Navigates to previous protected path or `/companies`.

Visual details:

- Three.js particle canvas is dynamically imported.
- GSAP entrance animation is dynamically imported.
- If either import fails, the page still works.

No OTP or real password is currently implemented.

### Company List Page

File: `src/pages/CompanyListPage.tsx`

Uses `useListCompaniesQuery`.

Features:

- loading, error, empty, and list states
- highlighted create-company button after a newly created login session
- refresh button
- company cards linking to `/companies/{id}`

### Company Create Page

File: `src/pages/CompanyCreatePage.tsx`

Creates a company with `useCreateCompanyMutation`.

Required field:

- `name`

Optional fields:

- `legal_name`
- `registration_number`
- `national_id`
- `active_slug`

Number-like fields are normalized before submit. After successful creation, navigates to `/companies/{createdCompany.id}`.

### Company Dashboard Page

File: `src/pages/CompanyDashboardPage.tsx`

This is a large route file containing local subcomponents:

- `CompanyInfoPanel`
- `AddProjectModal`
- `ProjectsPanel`
- `ProjectDocumentsPanel`

Secondary nav items:

- messages: active section
- company info: active section
- members: disabled placeholder
- projects/cost reports: active section
- coefficients: disabled placeholder
- settings: disabled placeholder

Dashboard state:

- `activeSection`: `messages`, `costReports`, or `company`
- `selectedProject`: project whose documents are being listed
- add-project modal state
- add-menu state
- local message text
- local pending attachment
- local messages array

Important limitation:

- Company messages are local React state only. They disappear on refresh. Financial documents and projects are persisted through backend APIs.

Attachment flow:

- In messages, plus menu can open cost-report builder or create a project attachment.
- When returning from the wizard, route state may contain `pendingCostReportAttachment`.
- Dashboard converts that route state into a local pending message attachment and clears route state with `navigate(..., { replace: true, state: null })`.

Project flow:

- Dashboard lists projects through `useListCompanyProjectsQuery`.
- New projects are created through `useCreateCompanyProjectMutation`.
- A project card can open its financial documents or start a new cost report with route state `{ existingProject: project }`.

Document list flow:

- `ProjectDocumentsPanel` lists documents with `useListProjectFinancialDocumentsQuery(project.id)`.
- Existing documents open the wizard with route state `{ existingDocument: document, existingProject: project }`.

### Cost Report Wizard Page

File: `src/pages/CostReportWizardPage.tsx`

This is the main builder flow.

Route:

- `/companies/:companyId/cost-reports/new`

Route state:

- `existingProject`: starts at document step.
- `existingDocument`: starts in browser mode at pricebook step.

Local sections:

- `project`
- `document`
- `pricebook`
- `coefficients`
- `finalize`

Wizard state:

- `step`: `setup` or `browser`
- `activeSection`
- `form`
- `createdProject`
- `createdDocument`
- selected pricebook, edition, chapter, group
- active chapter filter
- pricebook item search term
- selected item modal ID
- selected coefficient set
- show-lines modal

Default pricebook behavior:

- Chooses pricebook by selected ID, then `code === "ABN1404"`, then active pricebook, then first pricebook.
- Chooses edition year `1404` if present, otherwise highest year.
- Requires an active price set unless the dev fallback is explicitly confirmed.

Builder unlock rules:

- Project and document steps are always reachable.
- Pricebook, coefficients, and finalize require `createdDocument`.
- The wizard order is project, document, pricebook browser, coefficients, finalize.
- Existing-document route state still opens directly in browser mode at the pricebook step.

Document creation:

- `doSubmit()` creates a financial document via `useCreateProjectFinancialDocumentMutation`.
- Body includes:
  - `document_type: "cost_report"`
  - optional document number/report title/dates
  - required title
  - `pricebook_edition_id`
  - `price_set_id`

Finalize:

- `handleFinalizeDraft()` calls `lockFinancialDocument`.
- On success, navigates back to the company dashboard.

### Help Page

File: `src/pages/HelpPage.tsx`

Static help content plus a button to reset onboarding via `resetOnboarding`.

### Account Settings Page

File: `src/pages/AccountSettingsPage.tsx`

Shows current user info from Redux or fresh `auth/me` query.

Logout behavior:

- dispatches `logout()`
- resets RTK Query API cache with `baseApi.util.resetApiState()`
- navigates to `/login`

### Health Status Page

File: `src/features/health/HealthStatusPage.tsx`

Shows API base URL, health endpoint, and health response/error. Useful for checking `VITE_API_BASE_URL`.

## Cost Report Components

### Constants And Types

Files:

- `src/features/costReports/types.ts`
- `src/features/costReports/constants.ts`
- `src/features/costReports/costReportUtils.ts`

Important type groups:

- wizard sections and form state
- coefficient form state
- document totals
- item classification types: `single`, `multi-input`, `range-based`, `itemized`

Important constants:

- `builderSections`
- `chapterFilters`
- coefficient key/scope options
- `initialForm` with `base_year: "1404"`
- shared input/textarea class strings

Important utilities:

- default wizard form from route state
- default edition selection
- document totals extraction from `totals_snapshot_json`
- locked document detection
- empty/date/positive integer parsing
- chapter filter matching
- quantity normalization
- positive decimal validation
- coefficient labels
- schema-v2 parsing for `price_ranges` and `itemized_options`
- schema-v3 select input detection for `selected_row` inputs
- select option extraction from `inputs[].items` while preserving row codes as strings
- selected row-code to backend DB row-id resolution through `item.rows[].row_code`
- row matching for range-based items
- item classification
- manual-price and row-selection flags
- calculation message extraction

### Project Selector Section

File: `src/features/costReports/components/ProjectSelectorSection.tsx`

Lists company projects and lets user select one. If opened with an existing project, selection is locked.

### Document Info Section

File: `src/features/costReports/components/DocumentInfoSection.tsx`

Collects document title, report title, number, dates, pricebook, and edition.

Also contains a dev-only advanced section for manual `price_set_id`. This must stay explicit and gated by confirmation.

### Project Coefficient Panel

File: `src/features/costReports/components/ProjectCoefficientPanel.tsx`

Can:

- select active coefficient set
- create coefficient set
- list values for selected set
- create project/global, chapter, and row coefficient values
- edit coefficient key, scope target, display title, multiplier, and active flag
- toggle coefficient active flag
- delete coefficient value

Coefficient behavior:

- Shows the priority explanation `ردیف ← فصل ← کل پروژه`.
- For the same `coefficient_key`, row scope overrides chapter scope and chapter scope overrides project scope.
- Different `coefficient_key` values can apply together.
- Chapter targets come from the active pricebook edition chapters.
- Row targets come from rows already present in the current document lines and use backend row DB ids while displaying `row_code` as a string.
- A compact effective-priority preview groups active values by key and shows project/chapter/row/effective values.

### Pricebook Browser Section

File: `src/features/costReports/components/PricebookBrowserSection.tsx`

Desktop layout:

- right column: document summary and chapters
- draggable horizontal divider between chapter column and item area
- item header/group filters/search in left column
- vertical drag handle for item header height
- item list fills remaining height

Mobile layout:

- one panel at a time: chapters or items
- chapter filters are horizontal pills
- group filters are horizontal pills
- search can expand in items pane

Selecting an item opens `ItemDetailModal`.

### Item Detail Modal

File: `src/features/costReports/components/ItemDetailModal.tsx`

Fetches item detail with `useRetrievePricebookItemQuery(itemId)`.

Core item modes:

- `single`: simple quantity.
- `multi-input`: validates every backend-defined input and sends `values`.
- `range-based`: matches a row from `price_ranges` using the driving value, then sends `selected_row_id`.
- `itemized`: user chooses an option from `itemized_options`; fallback is raw `rows`.

Calculation:

- Uses `useCalculatePricebookItemMutation`.
- Builds one shared backend calculation payload from the current UI state.
- Debounces automatic calculation by 500ms after required local inputs become valid.
- Does not expose a separate manual Calculate/Edit button in v0.0; the modal keeps inputs editable until the user clicks Add or closes the modal.
- The active coefficient set selector is in the modal header beside the Add button, not inside the green calculation input box.
- The selector shows `بدون ضریب`, the default/active set, and other coefficient sets; changing it updates wizard state and makes the calculation payload stale.
- Shows local validation/incomplete status instead of calling the backend when required input is missing or invalid.
- Sends backend calculation request with:
  - `quantity` or `values`
  - optional `coefficient_set_id`
  - optional `manual_unit_price`
  - optional `pricebook_row_id` or `selected_row_id`
  - optional `footnotes` map
- optional sparse `custom_prices` map keyed by exact row-code strings
- Shows backend calculation response.
- For range-based items with valid inputs outside all `price_ranges`, the modal switches to a custom unit-price fallback instead of treating the missing range as a fatal calculation error.

Adding line:

- The only primary CTA is Add.
- Requires a valid local payload, a document, and an unlocked document.
- If the latest displayed calculation is missing or stale, Add first runs an immediate fresh backend calculation with the exact same payload snapshot.
- Uses `useCreateFinancialDocumentLineMutation`.
- Builds the line body from the same calculation payload plus the backend calculation response quantity.
- Includes the same `coefficient_set_id` in add-line when a coefficient set is selected.
- Includes the same sparse `custom_prices` map in add-line when row-level custom prices were applied.
- Then calls `recalculateFinancialDocument`.
- Updates parent `createdDocument`.
- Shows `AddedRowsView`.

Manual price:

- If item requires manual unit price, user must enter a positive decimal manual price.
- Missing manual price is not treated as zero.
- Row-level custom price edits do not use `manual_unit_price`; they are sent only through `custom_prices`.

Row-level custom prices:

- Static item rows are visually separate from backend calculation output.
- Each item row can enter a compact inline unit-price edit mode from the pencil icon action.
- Custom prices are held as `Record<string, string>` where the key is `item.rows[].row_code` exactly, preserving leading zeros.
- Only positive decimals can be applied; invalid row prices are not sent to calculate or add-line.
- Applied row prices do not mutate `item.rows` or official backend pricebook prices.
- Reverting a row removes it from `custom_prices`.
- Changing an applied custom price participates in `stablePayloadKey`, so automatic calculation becomes stale and refreshes after debounce.
- Calculation row source badges prefer backend source metadata and fall back to locally applied custom row-code keys when needed.

Out-of-range range fallback:

- If valid range-driving input is outside all defined price ranges, the fallback row is resolved from `properties_json.row_ids[0]`, then from the first row by `row_code`.
- The fallback row code stays a string and is never converted to a number.
- The calculation box shows a compact `بهای واحد سفارشی` input near the normal calculation inputs.
- Until that fallback unit price is valid, automatic calculation stays in a waiting/info state and does not call the backend.
- When valid, calculate/add-line send `custom_prices[fallbackRowCode]` without `manual_unit_price` and without `selected_row_id` for the range miss.

Row selection:

- Itemized options and explicit row-selection items are rendered as dropdowns inside the calculation form.
- Runtime input detection reads `item.properties_json.inputs` first, then generated `item.inputs`, because the v0.0 OpenAPI types do not yet model every schema-v3 runtime field.
- Schema-v3 `selected_row` inputs are detected when `input.name`, `input.key`, `input.type`, or `input.data_type` marks a select, or when `input.items` is present.
- Schema-v3 dropdown labels use `input.items[].short_name_fa` exactly as the visible option text. Do not prefix labels with row codes.
- Schema-v3 dropdown values store `input.items[].row_id` as strings so leading zeros are preserved.
- If schema-v3 `input.items` is missing, options fall back to `itemized_options`, then to `item.rows`; the fallback should keep the modal usable and only show a subtle helper, not a blocking API warning.
- Before calculate/add-line, the selected row code is resolved against `item.rows[].row_code` and sent to the backend as DB id `selected_row_id`.
- `values` contains only non-select numeric inputs, sorted by `value_key`; selected-row inputs are excluded from `values`.
- Items that require row selection block automatic calculation/add until a row/option is selected.
- Range-based items still auto-match the backend row range from the entered driving value.

Footnotes:

- Checklist state is held locally as `Record<noteCode, boolean>`.
- It is included in calculate/add-line body if selected.

### Calculation Section

File: `src/features/costReports/components/CalculationSection.tsx`

Pure presentational/form component for item calculation.

Responsibilities:

- render row-selection/itemized dropdowns when needed
- render quantity or multi-input fields
- render schema-v3 select inputs from `properties_json.inputs`/`inputs[].items` as dropdowns instead of numeric text inputs
- fall back to row titles when schema-v3 select option labels are absent, while keeping the Add flow available
- render non-select input labels with units in parentheses
- avoid appending units to select input labels
- render manual price field if needed
- render custom fallback unit price if an out-of-range range item needs it
- render calculation status
- render matched range row
- render backend calculation totals with `جمع کل محاسبه`
- render active row breakdown from `rows_breakdown`
- render official/custom price source badges from `rows_breakdown[].price_source` or backend custom row-code metadata
- render applied coefficients returned by the backend, including scope labels
- render validation and line errors

It does not call APIs directly.

### Document Summary Box

File: `src/features/costReports/components/DocumentSummaryBox.tsx`

Compact card used in pricebook browser. Shows line count, summed line totals from current document lines, lines modal button, starred-item button, and alerts for empty/locked document.

The starred-item button opens `StarredItemModal` when the document is unlocked. Locked documents disable this action with a helper message.

### Starred Item Modal

File: `src/features/costReports/components/StarredItemModal.tsx`

Adds standalone custom/starred lines to the current financial document.

Behavior:

- Collects title, optional description, unit, quantity, and manual unit price.
- Normalizes localized digits before submit.
- Validates title/unit and positive decimal quantity/unit price with submit-aware or touched-field errors.
- Shows a read-only total preview for convenience only; backend recalculation remains authoritative.
- Creates a line with `line_source: "starred"` and then calls `recalculateFinancialDocument`.
- Updates parent `createdDocument`, closes on success, and shows a toast.
- Respects locked documents and disables submit/close interactions while submitting.

### Document Lines Modal

File: `src/features/costReports/components/DocumentLinesModal.tsx`

Shows current lines, allows quantity edit/delete if document is not locked, and recalculates document after changes.

It keeps a local copy of lines for immediate modal display.

### Current Document Panel

File: `src/features/costReports/components/CurrentDocumentPanel.tsx`

Used in finalize section.

Capabilities:

- Shows document metadata and totals.
- Lists document lines.
- Edits/deletes line quantities while document is unlocked.
- Recalculates after line changes.
- Shows chapter totals.
- Builds local official-form HTML with `buildOfficialFormHtml`.
- Uses `B-NAZANIN.TTF` for printable preview.
- Shows preview inside sandboxed iframe with `sandbox=""`.
- Opens a print window for browser PDF export.

Important limitation:

- Although backend preview/export hooks exist in `financialDocumentApi`, this panel currently uses browser-generated HTML and browser print. It does not call backend preview/export.

## Excel Import Code

Folder: `src/features/costReports/excelImport/`

Files:

- `ExcelImportWizardModal.tsx`
- `MiniSpreadsheet.tsx`
- `ReviewStep.tsx`
- `wizardTypes.ts`

Status:

- Code exists.
- It uses `xlsx`, `financialDocumentExcelPlan`, and `createFinancialDocumentLinesBulk`.
- It supports direct spreadsheet paste or file upload, column mapping, ambiguity resolution, review, and bulk submit.
- It is not currently connected to `CostReportWizardPage` or any visible button.

If enabling it later, add a clear UI entry point, wire modal open/close state, and verify backend expectations around ambiguous row selection.

## Shared Components

Important reusable components:

- `Button`: app button variants.
- `IconButton`: square icon button.
- `GlassCard`: glass-style panel/card.
- `StatusBadge`: tone-based status pill.
- `Field`: label wrapper.
- `JalaliDateField`: Jalali UI backed by ISO date strings.
- `Tooltip`: simple tooltip wrapper.
- `HelpHint`: inline help hint.
- `InfoBox`: label/value display.
- `EmptyState`: reusable empty/error state.
- `GuidedTour`: page-specific onboarding overlays.
- `ToastContainer`: Redux toast renderer.
- `ThemeToggle`: toggles dark/light mode.
- `TopHeader`, `ContextHeader`, `PrimaryNav`, `SecondaryNav`, `MobileDrawer`: shell/navigation pieces.

## Styling Rules

Global CSS:

- `src/styles/index.css`
- Sets RTL defaults.
- Uses `data-theme` for light mode.
- Provides light-mode overrides for Tailwind-like `light:*` variants.

Tailwind:

- `tailwind.config.ts`
- `darkMode`: class and `[data-theme="dark"]`
- Custom `light` variant through plugin.
- Custom colors:
  - `ratab`
  - `brand`
  - `success`
  - `warning`
  - `danger`
- Font family: Vazirmatn.

Design direction:

- Persian-first RTL.
- Dark glass look with emerald/violet accents.
- Light theme is supported with `light:*` classes and `data-theme="light"`.
- Use lucide icons unless existing code uses another asset.

## Formatting And Number Utilities

File: `src/shared/utils/numberText.ts`

Functions:

- `normalizePersianDigits`
- `normalizeNumberInput`
- `normalizeRowCode`
- `containsLocalizedDigits`

Rules:

- Preserve row codes as strings.
- Normalize Persian/Arabic digits before numeric validation.
- Do not strip leading zeros from row codes.

File: `src/shared/utils/formatters.ts`

Functions:

- `formatMoneyAmount`
- `formatDecimal`
- `cleanDisplayText`
- `isMojibakeText`

`cleanDisplayText` hides likely mojibake backend/UI strings by returning fallback. This exists because some older source/docs/UI strings may appear mojibake in some Windows/PowerShell views.

## Error Handling

File: `src/shared/utils/apiError.ts`

Used to convert RTK Query errors to Persian display messages.

Common pattern:

- API calls use `.unwrap()`.
- `catch` dispatches `addToast({ message: getApiErrorMessage(error), type: "error" })` or sets local form error.
- No tokens/passwords are logged.

## Security And Data Rules

Do:

- Use generated OpenAPI types.
- Use backend calculations as source of truth.
- Keep token in session storage only.
- Use `Authorization: Token <token>`.
- Use `RequireAuth` for protected screens.
- Keep backend HTML preview sandboxed when rendering backend HTML.
- Preserve pricebook row codes as strings.
- Treat missing official unit price/manual price as special, never as zero.

Do not:

- Invent endpoints or payload fields.
- Modify backend source files from frontend tasks.
- Hardcode API URLs in components.
- Log tokens, passwords, or secrets.
- Use JS float math as authoritative financial totals.
- Embed backend pricebook data in frontend source.
- Assume company messages are persisted.

## Known Limitations In v0.0

- Product naming is inconsistent: principles say `ratab`, current UI often says `Metril`.
- Company messages are local only.
- Members, coefficients, and settings nav items inside company dashboard are mostly placeholders unless they map to a current active section.
- Dashboard-level coefficient nav is disabled; coefficient management currently lives inside the cost report wizard.
- `DashboardPreviewPage` is not routed.
- `ProjectInfoSection` is not used.
- Excel import modal exists but is not exposed in UI.
- Backend preview/export hooks exist but current final preview/export is browser-side HTML/print.
- The v0.0 OpenAPI schema still does not type `properties_json.inputs` or schema-v3 `selected_row.items`; frontend reads those runtime fields defensively, but exact short option labels require the backend response to include `selected_row.items[].short_name_fa`.
- The v0.0 OpenAPI schema still does not fully type runtime-supported `custom_prices` calculate/add-line payloads or standalone starred line fields; frontend keeps isolated local payload extensions in feature API files until schema generation includes them.
- Some docs/source strings may render as mojibake in PowerShell output depending on encoding.
- `VITE_DEFAULT_PRICE_SET_ID` is a deprecated dev fallback and should not become normal product flow.

## How To Add Or Change Features Safely

For API-backed changes:

1. Read `backend_docs/v0.0/ratab v0.0 Backend API.yaml`.
2. Regenerate schema with `npm run generate:api` if backend schema changed.
3. Add endpoint to the relevant `features/*/*Api.ts` file by injecting into `baseApi`.
4. Use generated component schema types.
5. Add invalidation/provides tags deliberately.
6. Wire UI with loading, error, empty, and success states.

For route changes:

1. Update `src/app/router.tsx`.
2. Verify `AppShell`, `ContextHeader`, and nav offsets.
3. Add or update guided-tour targets only if needed.
4. Update this project explain file.

For cost-report changes:

1. Identify whether change belongs in wizard orchestration (`CostReportWizardPage`) or a presentational component.
2. Keep calculation API calls in item-detail flow, not in display-only components.
3. Keep document totals from backend snapshots or backend recalculation.
4. Recalculate after mutating document lines.
5. Respect locked documents.
6. Update known limitations if behavior is still partial.

For UI changes:

1. Keep RTL and mobile behavior.
2. Preserve shell offsets when secondary nav exists.
3. Use existing shared components and Tailwind tokens.
4. Avoid adding large new abstractions unless they remove real duplication.

## Version Documentation Rule

The active version is stored in:

```text
code_oder/active_version.txt
```

The active project explanation is:

```text
code_oder/<active-version>/PROJECT_EXPLAIN.md
```

After every update, an AI/developer must:

1. Check `code_oder/active_version.txt`.
2. Update the matching `PROJECT_EXPLAIN.md` if behavior, architecture, routes, APIs, state, limitations, commands, or file ownership changed.
3. If a new version starts, create `code_oder/<new-version>/PROJECT_EXPLAIN.md`, update `active_version.txt`, and keep older version docs as historical records.

## Quick Mental Model For A New AI

This is not a blank Vite app. It is already a multi-flow Persian RTL business frontend.

The most important source files are:

- `src/app/router.tsx`
- `src/app/store.ts`
- `src/app/appShellContext.tsx`
- `src/shared/api/baseApi.ts`
- `src/features/auth/*`
- `src/pages/CompanyDashboardPage.tsx`
- `src/pages/CostReportWizardPage.tsx`
- `src/features/costReports/costReportUtils.ts`
- `src/features/costReports/components/ItemDetailModal.tsx`
- `src/features/costReports/components/CalculationSection.tsx`
- `src/features/costReports/components/CurrentDocumentPanel.tsx`
- `src/features/financialDocuments/financialDocumentApi.ts`
- `src/features/pricebooks/pricebookApi.ts`

If a task mentions calculation, pricebook item behavior, manual price, row selection, or document totals, start in the cost-report files and the backend OpenAPI schema before editing.

If a task mentions dashboard messages, remember they are local UI state and not backend-persisted.

If a task mentions deployment, use the Docker/static nginx path, not a public Vite dev server.
