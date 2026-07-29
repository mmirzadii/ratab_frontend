# Phase 9 Report — Financial-Document Selector & Group Drawer

Date: 2026-07-29  
Contract: `backend_docs/current/` (unchanged; types regenerated)

## Final financial-document selector structure

`FinancialDocumentActionModal` is list-first (no two large option cards):

- Compact header: title **صورت‌بهاها**, linked/selected project name, close, small **افزودن صورت‌بها**
- Scrollable existing-document list with **انتخاب** (not «باز کردن»)
- Public/custom: project-selection first (+ visible **ایجاد پروژه جدید**)
- Project-linked: locked project, no project picker

## Existing-document list behavior

Loads project financial documents via RTK Query. Selecting a row/action:

1. places one pending `financial_document` attachment;
2. closes the selector;
3. returns to the same chat;
4. preserves message text and pending file attachments;
5. skips duplicates of the same resource id.

## Add-document behavior

Header / empty-state **افزودن صورت‌بها** share `handleAddFinancialDocument`:

- Project-linked → locked project wizard + `returnToGroupId` / `lockProject`
- Public/custom → project select (or create) then wizard
- After creation, return seeds one pending attachment (no second confirm)

Empty list copy: `هنوز صورت‌بهایی برای این پروژه ساخته نشده است.`

## Final drawer action

Group info drawer top action is exactly **افزودن صورت‌بها** (replaces large `صورت‌بهاهای پروژه` link). Opens the same selector via `openFinancialDocumentRequestId` signal into `MessagesSection`.

## Four drawer tabs

1. صورت‌بهاها — documents shared in group messages; **باز کردن** for browse
2. فایل‌ها — authorized open/download
3. لینک‌ها — http(s) with `noopener noreferrer`
4. اعضا — `GET /api/company-groups/{id}/members/` active members

Header + tabs stay visible; tab body scrolls independently (`scrollBody={false}`).

## Members integration

Uses existing `useListCompanyGroupMembersQuery`. Shows display name, phone, role label, active status, initials. No online/last-seen/typing/unread. No invented management actions in the tab (custom group management remains in management slot where already supported).

## Stale-data prevention

On group change / drawer open: reset tab, clear messages, cancel in-flight collect, clear busy id. Members query is keyed by group id and skipped until the members tab is active.

## Removed obsolete UI

- Two-card «انتخاب موجود / ساخت جدید» selector
- Large `صورت‌بهاهای پروژه` drawer link
- Duplicate project financial-document entry points for project groups

## Primary files

- `AttachFinancialDocumentModal.tsx`
- `GroupInfoDrawer.tsx`
- `WorkspaceDetailsDrawer.tsx` (`scrollBody`)
- `MessagesSection.tsx` (`openFinancialDocumentRequestId`)
- `CompanyDashboardPage.tsx`
- `groupKinds.test.ts`

---

## Correction (2026-07-29) — wizard Project Selection add-project

`ProjectSelectorSection` (wizard step **انتخاب پروژه**) now includes compact **افزودن پروژه** when `lockProject` is false:

- Reuses shared `CreateProjectSheet` (same checkbox + create API as workspace / chat attachment flow)
- Empty list shows prominent add action (no “leave wizard / go to dashboard” dead-end)
- On success: RTK project/group invalidation + refetch, auto-select new project, update wizard route state, stay in wizard
- Hidden when project is locked from a project-linked group (`builderState.lockProject`)

---

## Correction (2026-07-29) — company member settings master-detail

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
| Subscription & quota | Removed admin-activation explanation, payment probe button, bank integration text, long payment-disabled card → one-line status |
| Wallet | Removed long explanation about token charging and admin-only recharge |
| Member settings | Owner: 4-bullet list → one sentence; peer admin: shortened; role selector helper removed; default-value hints under switches removed; promote/demote warnings shortened |
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

- `تعریف طرح‌ها و سقف‌ها تصمیم مالک محصول است و در فرانت اختراع نمی‌شود`
- `در نسخه فعلی فقط ادمین اشتراک را فعال می‌کند`
- `فرانت مبلغ، تعداد توکن، یا وضعیت پرداخت را تعیین نمی‌کند`
- `سرور مرجع نهایی دسترسی است`
- `RTK Query، تایپ‌های OpenAPI فعلی و فراخوانی سلامت بک‌اند`
- `نشست فعلی از طریق کوکی امن سرور بازیابی می‌شود`
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

New test file: `src/features/ui/textCleanup.test.ts` — 26 tests across 6 suites:
- No internal developer text in user-facing UI (13 phrases checked)
- Subscription page compact state verification
- Member settings conciseness verification
- Wallet section conciseness verification
- Error message language verification
- Accessibility labels preservation

### Primary files modified

- `SubscriptionSection.tsx` — compact payment status, removed probe
- `WalletSection.tsx` — concise subtitle
- `MemberSettingsPane.tsx` — shortened all explanatory text
- `HelpPage.tsx` — user-focused help cards
- `HealthStatusPage.tsx` — removed technical details
- `LandingPage.tsx` — shortened feature descriptions
- `DashboardPreviewPage.tsx` — removed implementation notes
- `MessagesSection.tsx` — shortened empty state
- `GroupsSection.tsx` — concise management messages
- `RequireAuth.tsx` — removed session explanation
- `CalculationSection.tsx` — user-friendly calculation text
- `MessageAttachmentCard.tsx` — shortened fallback text
- `AttachFinancialDocumentModal.tsx` — removed create-project button (prior fix), portal + mobile sheet + add-button fix

---

## Fix (2026-07-29) — mobile financial-document selector

### Root cause: mispositioned sheet

The `FinancialDocumentActionModal` rendered inside the `MessagesSection` DOM tree, which is a child of `overflow-hidden` flex containers and `GlassCard` components using `backdrop-blur-xl`. CSS `backdrop-filter` creates a new containing block, causing `position: fixed; inset: 0` to reference that ancestor instead of the viewport. On mobile (~390px), this made the modal appear anchored to the bottom-left corner of the parent card rather than filling the screen.

**Fix:** Render via `createPortal(sheet, document.body)` so the overlay escapes all ancestor stacking contexts. Mobile uses `h-dvh w-full` (full-screen sheet); desktop uses `md:max-w-lg md:h-auto` centered dialog. Background scroll is locked with `document.body.style.overflow = "hidden"`. Z-index raised to `z-[60]`.

### Root cause: button did nothing

`handleAddFinancialDocument` set `docIntent("create")` then checked `selectedProject && (projectLocked || step === "browse-documents")`. For a public/custom group on the `select-project` step with no project selected, `selectedProject` was null. The function fell through to `setStep("select-project")` — already the current step — which was a no-op. No validation message was shown.

**Fix:** Three new branches:
1. If no projects exist (`projects.length === 0`), jump directly to `create-project` step.
2. If on `select-project` with no selection, show validation hint: `ابتدا یک پروژه انتخاب کنید.`
3. Empty project state now includes a visible `ایجاد پروژه جدید` button (replacing the removed EmptyState-only display).

Validation hint clears when a project is selected. After project creation, `handleProjectCreated` auto-selects and continues to the document flow.

### Files changed

- `AttachFinancialDocumentModal.tsx` — portal, mobile full-screen sheet, body scroll lock, validation hint, empty-state create button, z-[60]
- `groupKinds.test.ts` — 13 new tests for mobile sheet and add-button behavior
