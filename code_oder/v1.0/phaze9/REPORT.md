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
