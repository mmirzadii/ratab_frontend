# Ratab Frontend Project Explain - v0.0

Last updated: 2026-07-28
Active version file: `code_oder/active_version.txt`
Current active version: `v0.0`
Documentation root note: the repository currently uses `code_oder` as the folder name. Do not rename it to `code_order` unless the project owner explicitly asks for a migration.

## Purpose

This file is the onboarding document for any AI or developer that needs to understand the Ratab frontend without guessing from scattered phase reports.

Before changing code, read these files in this order:

1. `code_oder/active_version.txt`
2. `code_oder/<active-version>/PROJECT_EXPLAIN.md`
3. `AI_CODE_PRINCIPLES.md`
4. `backend_docs/README.md`
5. Active backend contract under `backend_docs/current/` when synced; otherwise the Frontend v0.0 historical archive:
   - `backend_docs/history/v0.0/frontend_handoff_v0_0.md`
   - `backend_docs/history/v0.0/OPENAPI.yaml`
6. The local source files related to the requested change.

`backend_docs/current/BACKEND_VERSION` (backend contract) and `code_oder/active_version.txt` (frontend phase version) are separate identifiers.


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

- `npm run dev`: generates API types when current OpenAPI exists, then starts Vite.
- `npm run build`: generates API types when current OpenAPI exists, runs `tsc -b`, then builds Vite.
- `npm run lint`: generates API types when current OpenAPI exists, then runs ESLint.
- `npm run preview`: serves the built Vite output.
- `npm run generate:api`: reads `backend_docs/current/OPENAPI.yaml` (when synced) and writes `src/shared/api/generated/schema.ts`; skips with `CURRENT_BACKEND_CONTRACT_NOT_SYNCED` if that file is absent.
- `npm run validate:docs`: validates documentation ownership and structure.

Important: `src/shared/api/generated/schema.ts` is generated. Do not hand-edit it unless the task is explicitly about a temporary generated-schema patch. Do not regenerate from historical OpenAPI once `backend_docs/current/OPENAPI.yaml` exists.


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
- `backend_docs/`: backend-delivered contracts only (`current/` active when synced; `history/` archive).
- `docs/`: frontend-owned product/design references and documentation reports.
- `docs/product_reference/v0.0/`: UI/product flow references formerly under `code_oder/v0.0/reference/`.
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

The coefficient screen exposes all backend-supported scopes in one compact form: whole project, a selected pricebook chapter, or a row already present in the current financial document. The screen keeps set creation collapsed, removes the former priority tutorial/table, and shows registered coefficients in a compact editable list. Submitting an existing coefficient-key/scope/target combination updates that value instead of attempting a duplicate create. Backend calculation remains authoritative; for equal coefficient keys, row scope overrides chapter scope and chapter scope overrides project scope.

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

- The shell is constrained to `100dvh` on mobile and desktop. The browser page itself stays fixed; `main` is the controlled vertical scroll region and feature panels may use smaller internal scroll regions for long lists/tables.

- Desktop:
  - fixed primary nav on the right (`PrimaryNav`)
  - optional secondary nav beside it (`SecondaryNav`)
  - content gets `lg:pr-20` or `lg:pr-[19rem]`
- Mobile:
  - fixed `PrimaryTopBar`
  - compact context header below the primary bar
  - slide-out `MobileDrawer`
  - optional secondary panel inside drawer
  - no duplicate inline wizard step strip; wizard sections remain available in the drawer and next/back stay in the fixed context header
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
- Mobile headers avoid repeating the brand block and secondary descriptions already shown by `PrimaryTopBar`.

## Pages

### Landing Page

File: `src/pages/LandingPage.tsx`

Public marketing/demo page. Shows feature cards and workflow. CTA goes to `/login` unless a token exists, then `/companies`.

On mobile the example pricebook table becomes stacked row cards, actions use a two-column layout, and the hero/features/workflow use compact spacing without horizontal page overflow.

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
- The login frame uses dynamic viewport height and remains vertically usable when the mobile keyboard reduces the visible viewport.

No OTP or real password is currently implemented.

### Company List Page

File: `src/pages/CompanyListPage.tsx`

Uses `useListCompaniesQuery`.

Features:

- loading, error, empty, and list states
- highlighted create-company button after a newly created login session
- refresh button
- company cards linking to `/companies/{id}`
- Mobile cards/actions are compact, have at least 44px touch targets, and avoid separate horizontal overflow.

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

On mobile only the required company name is shown initially. The optional fields live in one responsive disclosure; the same field instances are reused on desktop rather than mounting duplicate mobile and desktop forms.

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

Mobile dashboard behavior:

- A visible three-tab switcher exposes messages, projects, and company info without requiring the drawer.
- The dashboard card fits the remaining viewport and each active panel owns its necessary internal scroll.
- Project/document cards, message attachments, composer actions, and empty states use compact mobile layouts.
- Project creation is a viewport-bounded bottom sheet with a scrollable body and sticky actions; company-info save remains reachable at the bottom of its panel.

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
- The document form treats pricebook family and yearly edition as separate selections. It aggregates editions from the existing per-pricebook endpoints, deduplicates families by backend `pricebook_family_code`, displays `pricebook_persian_name` only, displays the explicit numeric `year` only, and submits the selected edition's real `id`. Existing documents retain their saved edition even when newer years are available.
- The document-information step has no duplicate card/page heading and omits the former informational/development blocks.
- Mobile shows only the required title and pricebook/year initially; report title, document number, and dates are grouped under one optional `اطلاعات تکمیلی` disclosure.
- The project step likewise relies on the context-header title rather than repeating a heading inside its card.
- On every viewport, `AppShell` is constrained to `100dvh`; navigation/context actions stay reachable while genuinely long content scrolls inside the app content region instead of moving the whole browser page.

Mobile section behavior:

- Pricebook browsing is a viewport-bounded panel with compact chapter/group/search controls and an internally scrolling item list.
- Coefficients use two mobile panes (`افزودن ضریب` and `ثبت‌شده‌ها`) while keeping the active coefficient-set selector visible; the panel and lists own their scroll.
- Final review uses mobile line cards instead of the desktop-wide table, with compact totals/details and a bounded preview region.

Finalize:

- `handleFinalizeDraft()` calls `lockFinancialDocument`.
- On success, navigates back to the company dashboard.

### Help Page

File: `src/pages/HelpPage.tsx`

Static help content plus a button to reset onboarding via `resetOnboarding`.

Mobile help renders as a one-open-at-a-time accordion; desktop keeps the two-column help cards.

### Account Settings Page

File: `src/pages/AccountSettingsPage.tsx`

Shows current user info from Redux or fresh `auth/me` query.

Mobile account data is rendered as compact label/value rows and the logout action is full width.

Logout behavior:

- dispatches `logout()`
- resets RTK Query API cache with `baseApi.util.resetApiState()`
- navigates to `/login`

### Health Status Page

File: `src/features/health/HealthStatusPage.tsx`

Shows API base URL, health endpoint, and health response/error. Useful for checking `VITE_API_BASE_URL`.

Long URLs/schema paths break safely on mobile, status rows are compact, and retry is a full-width touch target.

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
- numeric input validation for strict-positive main inputs and non-negative secondary inputs
- coefficient labels
- schema-v2 parsing for `price_ranges` and `itemized_options`
- schema-v3 select input detection for `selected_row` inputs
- select option extraction from `inputs[].items` while preserving row codes as strings
- selected row-code to backend DB row-id resolution through `item.rows[].row_code`
- row matching for range-based items
- item classification
- manual-price and row-selection flags
- calculation message extraction
- active calculation row extraction for compact details and item-row highlighting

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
- Registered values are shown as a compact editable list; the former priority tutorial and preview table were removed to keep the screen focused.
- Deleting a coefficient from an unlocked document recalculates that document and replaces wizard document state with the authoritative backend response, so final totals and subsequently generated previews cannot retain the deleted coefficient snapshot. Locked documents disable coefficient deletion.

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
- the redundant five-step card is hidden on the pricebook step because the same navigation remains available through the mobile drawer and wizard back/next controls
- chapter filters are horizontal pills
- group filters are horizontal pills
- search replaces the chapter title in the same toolbar instead of adding another vertical row
- document totals/actions collapse into one compact toolbar, empty-state messaging is suppressed there, and the redundant `آیتم‌ها` list heading is removed
- the item list receives the remaining viewport height and owns its own scrolling

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
- The selector is compact on mobile, shows `بدون ضریب`, the default/active set, and other coefficient sets; changing it updates wizard state and makes the calculation payload stale.
- Shows local validation/incomplete status instead of calling the backend when required input is missing or invalid.
- For backend-defined numeric inputs, `is_main_input=true` requires a strict positive value, while non-main inputs accept zero when `min_value` is `0` or absent and default to a non-negative minimum.
- Non-main quantity inputs that explicitly depend on the main input, or share the main input unit, are blocked if they exceed the main value.
- Sends backend calculation request with:
  - `quantity` or `values`
  - optional `coefficient_set_id`
  - optional `manual_unit_price`
  - optional `pricebook_row_id` or `selected_row_id`
  - optional `footnotes` map
- optional sparse `custom_prices` map keyed by exact row-code strings
- Shows backend calculation response as a compact total by default.
- Extra calculation metadata is hidden behind a `جزئیات` toggle.
- The `ردیف‌ها` action in the calculation summary scrolls the modal body to the item rows section.
- Rows used by backend calculation are highlighted in the existing `ردیف‌های فهرست‌بها` list with calculated quantity and row total.
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
- Expands the newly added logical line into active official rows from `calculated_rows` or `calculation_output_json.rows_breakdown`, falling back to line snapshots only when no breakdown exists.

Manual price:

- If item requires manual unit price, user must enter a positive decimal manual price.
- Missing manual price is not treated as zero.
- Row-level custom price edits do not use `manual_unit_price`; they are sent only through `custom_prices`.

Row-level custom prices:

- Price entry has one source of truth: whenever an API item exposes concrete rows, user prices are edited only on those rows and stored in `custom_prices[row_code]`; the generic `manual_unit_price` field is reserved for legacy/standalone items with no concrete row. Range fallback rows follow the same row editor path instead of rendering a second price field.
- Static item rows are visually separate from backend calculation output.
- On mobile, static item rows render as dense list items with inline price/edit controls, one-line title/description, and compact active quantity/amount text.
- Each item row can enter a compact inline unit-price edit mode from the pencil icon action.
- Custom prices are held as `Record<string, string>` where the key is `item.rows[].row_code` exactly, preserving leading zeros.
- Only positive decimals can be applied; invalid row prices are not sent to calculate or add-line.
- Applied row prices do not mutate `item.rows` or official backend pricebook prices.
- Reverting a row removes it from `custom_prices`.
- Changing an applied custom price participates in `stablePayloadKey`, so automatic calculation becomes stale and refreshes after debounce.
- Calculation row source badges prefer backend source metadata and fall back to locally applied custom row-code keys when needed.
- Any user-determined unit price uses the product label `★ ستاره‌دار`, including missing/zero official rows, official overrides, range fallbacks, footnote prices, and standalone starred items. A zero or absent starred unit price renders as `-`, never as a valid zero price.
- Add validates locally known active starred rows and maps backend `requires_starred_prices` / `missing_starred_prices` responses by exact string `row_code`. All missing rows are highlighted with compact inline editors; the modal scrolls to and focuses the first missing input, and the status dot becomes red only because Add failed.
- Calculation details, the immediate added-row view, document lines, final review, and browser-built print/export preview classify each expanded row independently from backend price-source and starred snapshot fields. Mixed official/starred rows therefore retain separate labels inside one logical line.

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
- `values` contains only non-select numeric inputs, sorted by `value_key`; selected-row inputs are excluded from `values` and validated separately.
- Items that require row selection block automatic calculation/add until a row/option is selected.
- Item row selection uses an app-rendered responsive listbox instead of the browser-native select. Long Persian option labels wrap inside the modal width, the menu has a viewport-bounded internal scroll, and the mobile modal header places title/close above coefficient/add actions to prevent horizontal overflow.
- Range-based items still auto-match the backend row range from the entered driving value.

Footnotes:

- Checklist state is held locally as `Record<noteCode, boolean>`.
- Input-bearing footnotes render compact conditional fields directly below the checked note; defaults initialize on first selection and local drafts survive temporary unchecking.
- Footnote input drafts, touched state, and field errors are keyed by string note codes and metadata input names. Numeric validation normalizes localized digits and enforces optional minimum/maximum values, including zero.
- `buildFootnotesPayload()` is the canonical source for calculate, add-line, and stable calculation keys: boolean notes remain `true`, while input-bearing notes use `{ active: true, values }`; unchecked or invalid hidden values are excluded.
- Incomplete active footnote inputs pause automatic calculation with the yellow status dot. Add marks fields touched and turns the dot red on validation failure; structured backend footnote errors are mapped back to their field.
- Footnote values, including cross-chapter and starred-price metadata inputs, are submitted to the backend for authoritative calculation and document snapshot handling; the frontend does not calculate their financial effect.
- The v0.0 generated schema does not yet model `requires_input`, `inputs`, or their field metadata, so `pricebookApi.ts` temporarily extends the generated note/detail types without modifying generated schema.

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
- render a tiny accessible calculation status dot: green for up-to-date success, yellow for pending/incomplete/stale/calculating, and red only after an explicit Add failure
- render matched range row
- render only compact `جمع کل` by default after calculation
- render a collapsed `جزئیات` panel with row code, quantity, unit price, base amount, coefficient amount, total, compact row breakdown, and applied coefficients
- render official/custom price source badges from `rows_breakdown[].price_source` or backend custom row-code metadata inside details
- expose a `ردیف‌ها` callback button when the modal can scroll to item rows
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
- On mobile it is a full-height sheet with fixed header/footer, an internally scrolling form, and optional description collapsed until requested.

### Document Lines Modal

File: `src/features/costReports/components/DocumentLinesModal.tsx`

Shows current lines, allows quantity edit/delete if document is not locked, and recalculates document after changes.

It keeps a local copy of lines for immediate modal display.

When a logical document line contains multiple active calculated pricebook rows, the modal shows the parent line once with edit/delete controls and displays the expanded official rows inside the group.

On mobile the modal is a full-height sheet. Header/footer remain fixed, the line list is the only vertical scroll region, and edit/delete controls use touch-sized targets.

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

Line rendering and the browser-built official preview use `getLineDisplayRows()` so multi-row calculations are shown as their active official rows while totals still come from backend snapshots.

Mobile final review replaces the wide table with vertically scrolling line cards and collapses secondary document totals/metadata; desktop retains the table.

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
- Its mobile shell is already viewport-bounded: fixed header/primary actions, one scrolling body, stacked column mapping, and bounded spreadsheet/file previews.

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

1. Read `backend_docs/current/OPENAPI.yaml` when synced; otherwise the historical Frontend v0.0 archive `backend_docs/history/v0.0/OPENAPI.yaml`.
2. Regenerate schema with `npm run generate:api` if the active backend schema changed (requires current OpenAPI).
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
2. Keep route shells at `100dvh`; put scrolling in `AppShell` main or a clearly bounded feature panel, not on the browser page.
3. Preserve shell offsets when secondary nav exists.
4. Keep primary mobile actions at least 44px tall and prevent long Persian text/codes from widening the viewport.
5. Use existing shared components and Tailwind tokens.
6. Avoid mounting duplicate mobile/desktop forms; prefer one responsive field tree or a small reusable field component.
7. Avoid adding large new abstractions unless they remove real duplication.

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
