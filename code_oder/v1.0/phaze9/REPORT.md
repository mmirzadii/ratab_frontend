# Phase 9 Report ? Financial-Document Selector & Group Drawer

Date: 2026-07-29  
Contract: `backend_docs/current/` (unchanged; types regenerated)

## Final financial-document selector structure

`FinancialDocumentActionModal` is list-first (no two large option cards):

- Compact header: title **??????????**, linked/selected project name, close, small **?????? ????????**
- Scrollable existing-document list with **??????** (not ???? ?????)
- Public/custom: project-selection first (+ visible **????? ????? ????**)
- Project-linked: locked project, no project picker

## Existing-document list behavior

Loads project financial documents via RTK Query. Selecting a row/action:

1. places one pending `financial_document` attachment;
2. closes the selector;
3. returns to the same chat;
4. preserves message text and pending file attachments;
5. skips duplicates of the same resource id.

## Add-document behavior

Header / empty-state **?????? ????????** share `handleAddFinancialDocument`:

- Project-linked ? locked project wizard + `returnToGroupId` / `lockProject`
- Public/custom ? project select (or create) then wizard
- After creation, return seeds one pending attachment (no second confirm)

Empty list copy: `???? ?????????? ???? ??? ????? ????? ???? ???.`

## Final drawer action

Group info drawer top action is exactly **?????? ????????** (replaces large `??????????? ?????` link). Opens the same selector via `openFinancialDocumentRequestId` signal into `MessagesSection`.

## Four drawer tabs

1. ?????????? ? documents shared in group messages; **??? ????** for browse
2. ??????? ? authorized open/download
3. ??????? ? http(s) with `noopener noreferrer`
4. ???? ? `GET /api/company-groups/{id}/members/` active members

Header + tabs stay visible; tab body scrolls independently (`scrollBody={false}`).

## Members integration

Uses existing `useListCompanyGroupMembersQuery`. Shows display name, phone, role label, active status, initials. No online/last-seen/typing/unread. No invented management actions in the tab (custom group management remains in management slot where already supported).

## Stale-data prevention

On group change / drawer open: reset tab, clear messages, cancel in-flight collect, clear busy id. Members query is keyed by group id and skipped until the members tab is active.

## Removed obsolete UI

- Two-card ??????? ????? / ???? ????? selector
- Large `??????????? ?????` drawer link
- Duplicate project financial-document entry points for project groups

## Primary files

- `AttachFinancialDocumentModal.tsx`
- `GroupInfoDrawer.tsx`
- `WorkspaceDetailsDrawer.tsx` (`scrollBody`)
- `MessagesSection.tsx` (`openFinancialDocumentRequestId`)
- `CompanyDashboardPage.tsx`
- `groupKinds.test.ts`

---

## Correction (2026-07-29) ? wizard Project Selection add-project

`ProjectSelectorSection` (wizard step **?????? ?????**) now includes compact **?????? ?????** when `lockProject` is false:

- Reuses shared `CreateProjectSheet` (same checkbox + create API as workspace / chat attachment flow)
- Empty list shows prominent add action (no ?leave wizard / go to dashboard? dead-end)
- On success: RTK project/group invalidation + refetch, auto-select new project, update wizard route state, stay in wizard
- Hidden when project is locked from a project-linked group (`builderState.lockProject`)

---

## Correction (2026-07-29) ? company member settings master-detail

Ordinary member settings use workspace list+detail (no modal):

- Load: `GET /api/company-members/{id}/settings/`
- Save: `PATCH .../settings/` with `permission_settings`
- Employee: full configurable Switch catalog
- Admin: inherited Employee note + Admin-only switches
- See `code_oder/v1.0/phaze3/REPORT.md` and `backend_docs/current/PERMISSIONS.md`

---

## UX text cleanup (2026-07-29)

Removed all internal developer-facing explanations, backend implementation notes, and verbose helper text from the user-facing UI. The interface is now compact, clear, and action-oriented.

### Screens cleaned

| Screen | Changes |
| --- | --- |
| Subscription & quota | Removed admin-activation explanation, payment probe button, bank integration text, long payment-disabled card ? one-line status |
| Wallet | Removed long explanation about token charging and admin-only recharge |
| Member settings | Owner: 4-bullet list ? one sentence; peer admin: shortened; role selector helper removed; default-value hints under switches removed; promote/demote warnings shortened |
| Help page | Removed all backend/frontend internal references from help cards |
| Health status | Removed RTK Query/OpenAPI technical description; replaced backend terminology with user-friendly text |
| Landing page | Shortened feature descriptions, removed backend references |
| Dashboard preview | Removed implementation notes and technical session description |
| Messages | Shortened empty-state group message |
| Groups | Shortened management-disabled and read-only messages |
| Auth (RequireAuth) | Removed "cookie server session" explanation |
| Calculation | Removed "backend calculates" phrasing |
| Message attachment | Shortened legacy attachment fallback text |

### Internal text removed (examples)

- `????? ?????? ? ?????? ????? ???? ????? ??? ? ?? ????? ?????? ???????`
- `?? ???? ???? ??? ????? ?????? ?? ???? ??????`
- `????? ????? ????? ????? ?? ????? ?????? ?? ????? ???????`
- `???? ???? ????? ?????? ???`
- `RTK Query? ???????? OpenAPI ???? ? ???????? ????? ??????`
- `???? ???? ?? ???? ???? ??? ???? ??????? ??????`
- Long owner permission bullet list
- Payment probe button and notice UI

### Warnings intentionally preserved

- Unsaved changes confirmations (`window.confirm`)
- Destructive action dialogs (deactivate member, remove member)
- Role change warnings (promote to admin, demote to employee)
- Permission catalog mismatch error with retry
- Locked financial document indicators
- Insufficient token / quota exceeded messages

### Tests

New test file: `src/features/ui/textCleanup.test.ts` ? 26 tests across 6 suites:
- No internal developer text in user-facing UI (13 phrases checked)
- Subscription page compact state verification
- Member settings conciseness verification
- Wallet section conciseness verification
- Error message language verification
- Accessibility labels preservation

### Primary files modified

- `SubscriptionSection.tsx` ? compact payment status, removed probe
- `WalletSection.tsx` ? concise subtitle
- `MemberSettingsPane.tsx` ? shortened all explanatory text
- `HelpPage.tsx` ? user-focused help cards
- `HealthStatusPage.tsx` ? removed technical details
- `LandingPage.tsx` ? shortened feature descriptions
- `DashboardPreviewPage.tsx` ? removed implementation notes
- `MessagesSection.tsx` ? shortened empty state
- `GroupsSection.tsx` ? concise management messages
- `RequireAuth.tsx` ? removed session explanation
- `CalculationSection.tsx` ? user-friendly calculation text
- `MessageAttachmentCard.tsx` ? shortened fallback text
- `AttachFinancialDocumentModal.tsx` ? removed create-project button (prior fix), portal + mobile sheet + add-button fix

---

## Fix (2026-07-29) ? mobile financial-document selector

### Root cause: mispositioned sheet

The `FinancialDocumentActionModal` rendered inside the `MessagesSection` DOM tree, which is a child of `overflow-hidden` flex containers and `GlassCard` components using `backdrop-blur-xl`. CSS `backdrop-filter` creates a new containing block, causing `position: fixed; inset: 0` to reference that ancestor instead of the viewport. On mobile (~390px), this made the modal appear anchored to the bottom-left corner of the parent card rather than filling the screen.

**Fix:** Render via `createPortal(sheet, document.body)` so the overlay escapes all ancestor stacking contexts. Mobile uses `h-dvh w-full` (full-screen sheet); desktop uses `md:max-w-lg md:h-auto` centered dialog. Background scroll is locked with `document.body.style.overflow = "hidden"`. Z-index raised to `z-[60]`.

### Root cause: button did nothing

`handleAddFinancialDocument` set `docIntent("create")` then checked `selectedProject && (projectLocked || step === "browse-documents")`. For a public/custom group on the `select-project` step with no project selected, `selectedProject` was null. The function fell through to `setStep("select-project")` ? already the current step ? which was a no-op. No validation message was shown.

**Fix:** Three new branches:
1. If no projects exist (`projects.length === 0`), jump directly to `create-project` step.
2. If on `select-project` with no selection, show validation hint: `????? ?? ????? ?????? ????.`
3. Empty project state now includes a visible `????? ????? ????` button (replacing the removed EmptyState-only display).

Validation hint clears when a project is selected. After project creation, `handleProjectCreated` auto-selects and continues to the document flow.

### Files changed

- `AttachFinancialDocumentModal.tsx` ? portal, mobile full-screen sheet, body scroll lock, validation hint, empty-state create button, z-[60]
- `groupKinds.test.ts` ? 13 new tests for mobile sheet and add-button behavior

---

## Correction (2026-07-30) ? calculation-based token policy + company wallet

Focused frontend correction (no new phase folder):

- Removed obsolete fixed 5-token official-line-create UX and auto/debounced paid calculate.
- Official/starred: free inspect ? explicit `??????` ? receipt ? Add with `calculation_receipt_id`.
- Costs and debit breakdown from backend; combined insufficient-balance dialog.
- Company wallet section + donation on company information; personal balance chip in header/settings.
- Signup/login invalidate personal wallet tags so backend-granted balance is fetched (no local grant).
- Validation: `npm run generate:api`, `validate:docs`, `tsc -b`, lint, `test:calculation-billing`, build ? all passed.

## Correction (2026-07-30) ? account settings page cleanup

Account settings aligned with the compact Telegram-inspired workspace:

- Wide content (`max-w-[1240px]`) instead of narrow `max-w-2xl` stacked cards
- Tabs: ???? / ???? / ?????? via `?tab=`
- Summary strip: balance, effective plan, messages today, account status
- Compact Persian transaction rows (no English backend `reason` text)
- Isolated loading/errors per resource

## Correction (2026-07-30) ? account token hierarchy polish

- Header token badge (`N ????`) is the primary quick-glance balance.
- Removed oversized amber token hero / giant ???? emphasis from the Token tab.
- Token tab: compact 3-metric row (balance + official/starred costs), one-line packages note, dense scrollable transactions.

## Correction (2026-07-30) ? settings header / dedupe polish

- Header: circular avatar (initial) + prominent token chip; summary no longer repeats balance.
- Token packages as distinct cards; history accordion.

## Correction (2026-07-30) ? Telegram-like composer auto-resize

- Replaced fixed/`max-h-28` textarea growth with `scrollHeight` auto-resize (`composerTextarea.ts`).
- Min height 44px; max 160px desktop / 140px mobile; overflow scrolls only past max.
- Composer grows upward; add/send buttons stay bottom-aligned (`items-end`).
- Enter sends (IME-safe); Shift+Enter inserts a newline; successful send resets to min height.
- Tests: `npm run test:composer-textarea`.

## Correction (2026-07-30) ? dedupe mobile workspace title

- Duplicate workspace title came from mobile `PrimaryTopBar` + `TopHeader` (via `ContextHeader`).
- Shared `getWorkspaceHeaderCopy`; mobile uses PrimaryTopBar only; TopHeader is `lg:block` only.
- `/companies` page heading remains `???????? ???` with create/refresh actions.

## Correction (2026-07-30) ? single shell token balance badge

- Previous implementations: (1) compact `TokenBalanceChip` in `TopHeader` (amount only, linked to `/settings`); (2) preferred gold button on `AccountSettingsPage` header (`N ????`).
- Removed account-page header badge; upgraded shared `TokenBalanceChip` to preferred design and `/settings?tab=tokens`.
- Placement: desktop identity group in `TopHeader`; compact chip in mobile `PrimaryTopBar`.
- Tests: `npm run test:token-balance-chip` + updated `test:account-settings`.

## Correction (2026-07-30) � conversation list activity ordering

- Removed local alphabetical / kind-bucket sortConversations (public ? project ? custom + localeCompare).
- New behavior: preserve backend list order; only ensure public group stays first (is_default / group_type / pin_priority).
- Synced ackend_docs/current/ from published backend rontend_docs so OpenAPI includes last_activity_at.
- createGroupMessage now takes companyId and invalidates CompanyGroup:COMPANY-{id} **only on success** (failed sends do not reorder).
- Group/project create already invalidated the company group list; left in place.
- Selected selectedMessageGroupId and message draft remain in React state across list refetch.
- Focus/reconnect refetch enabled on group list queries (existing setupListeners).
- Tests: groupKinds.test.ts + conversationActivityOrder.test.ts.

## Correction (2026-07-30) � Token tab demo purchase

- Package cards use server `token_packages`; Buy opens a viewport-bounded confirmation sheet.
- Demo badge `???????` when `commerce.mode === demo` and purchase is available.
- Success toast: `???? ???? ?? ?????? ?? ???? ??? ????? ??.`; history label `???? ???? ????`.
- Tests: `npm run test:wallet-purchase`.

## Correction (2026-07-30) - dual wallet badges in company workspace

- Personal `TokenBalanceChip` (amber) remains the only global personal balance indicator.
- Active company workspace shows compact sky `CompanyTokenBadge` beside the company name in `WorkspaceContextHeader` (`شرکت: N توکن`).
- Badge uses `GET /api/companies/{id}/token-wallet/` keyed by company id; switching companies skips/refetches; donation and calculation spend invalidate company wallet tags.
- Not shown on company list, login/signup, or account settings without an active company workspace.

## Correction (2026-07-30) - official pricebook item modal billing UX

- Removed Add-disabled-without-receipt gate from `ItemDetailModal`.
- Add without a fresh receipt deliberately runs official calculation then creates the line once.
- Insufficient combined balance uses shared modal copy `توکن کافی نیست` and navigates `خرید توکن` → `/settings?tab=tokens` (tab survives refresh; no auto-retry charge).
- Tests expanded under `npm run test:calculation-billing` (includes `insufficientTokenModal.test.ts`).

## Correction (2026-07-30) - Telegram-like custom group create route

- Removed the centered GroupsSection create modal.
- Route: /companies/:companyId/groups/new nested under the company workspace.
- Desktop: ~416–480px full-height side panel beside chat (no modal backdrop).
- Mobile: full content area; bottom workspace nav hidden while creating.
- Two-step draft (info → members); one POST /api/companies/{id}/groups/ with 
ame, description, optional member_ids.
- Active members only (ctive_only + q); creator omitted from invite list; selected members receive pending invitations.
- Success invalidates group list + invitations and opens the new conversation.

## Correction (2026-07-30) - Telegram-inspired group info side panel

- Replaced the crowded GroupsSection admin form (edit fields + add-member select + permanent row actions) with a profile-first GroupInfoDrawer.
- Internal panel views: overview / edit / addMembers / memberDetails (no centered modals, no notification switch).
- Desktop: ~384-416px side panel beside chat; mobile: full-screen panel without dimmed backdrop.
- Tabs order: اعضا → صورت‌بهاها → فایل‌ها → لینک‌ها; floating Add Member for custom groups.
- Destructive deactivate moved under collapsed اقدامات حساس.

## Correction (2026-07-30) - Metril Corporate Blue color system

- Centralized semantic tokens in `src/styles/index.css` (`--ui-*`, `--brand-*`) for light and dark `data-theme`.
- Tailwind aliases in `tailwind.config.ts` under `colors.ui` / `colors.brand`.
- Shared primitives migrated first (Button primary = brand blue, GlassCard, IconButton, StatusBadge, nav, AppShell, toasts, switches, chips).
- Feature screens migrated off emerald/mint/violet dual `light:` overrides onto semantic roles.
- Removed pale-green light canvas and bright dark white dividers; FOUC script in `index.html`.
- Printable financial-document HTML CSS left unchanged.
- Theme docs: `docs/product_reference/v0.0/UI_THEME_NOTES.md`.

## Correction (2026-07-30) - official calculation-session auto-calc (selective)

- Rejected manual-`محاسبه` official-item workflow removed.
- Session-based automatic calculation restored (one session per modal open; 500ms debounce; first success may charge; later same-session recalcs free).
- Unrelated Phase 9 work (Corporate Blue, wallets, groups, badges, etc.) preserved.

## Correction (2026-07-31) - Group Info edit / add-members refinement

- Confirmed no centered edit/add-member modals (`isEditModalOpen` / `isAddModalOpen` remain absent).
- Pencil + FAB gated by `canEditMeta` / `canManageMembership` for custom groups only.
- Admin manage path uses backend `effective_permissions.can_manage_all_custom_groups` (plus creator path); owner always; employee creator-only.
- Pending invitees appear as non-selectable «دعوت در انتظار» rows (no duplicate invite).
- Save returns to overview without a success toast; invite submit disabled until a selection exists.
- Tests: `groupInfoPanel.test.ts` + `canManageGroup` cases under `npm run test:company-groups`.
