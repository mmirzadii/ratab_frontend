# Phase 9 User Actions Required

## Live QA checklist

1. Confirm primary rail/mobile shows only گفتگوها / اعضا / شرکت — not Projects or Groups.
2. Conversation list order: عمومی → project rows with `پروژه` → custom.
3. List `+` → پروژه جدید / گروه جدید; after create, the new conversation opens.
4. Composer: exactly one **افزودن**; menu shows only **فایل** and **صورت‌بها**.
5. Empty chat / composer / drawer **افزودن صورت‌بها** open the same selector.
6. Selector shows existing project documents directly (not two large cards); header has small **افزودن صورت‌بها**; rows use **انتخاب**.
7. Project conversation: no project picker; public/custom require project selection with **ایجاد پروژه جدید**.
8. Selecting or creating a document places one pending attachment without a second confirm.
9. Drawer tabs: صورت‌بهاها / فایل‌ها / لینک‌ها / اعضا; shared docs use **باز کردن**; files use authorized open/download; links use noopener/noreferrer; members list loads for the active group only.
10. Switching groups clears stale drawer resources before showing the new group.
11. Theme, logout, members/invitations, cost-report wizard, and send still work.
12. Members list: role badges + focused **تنظیمات**; Owner is never an ordinary selectable role. Fine-grained permission switches / ownership transfer wait on backend contract sync (`../phaze3/USER_ACTIONS_REQUIRED.md`).
13. Cost-report wizard **انتخاب پروژه** shows compact **افزودن پروژه** (shared sheet) when not `lockProject`; after create, the new project is auto-selected without leaving the wizard.

No new backend decisions required for Phase 9 chat UX. Group members listing uses existing `GET /api/company-groups/{id}/members/`.

## Mobile financial-document selector QA

14. At ~390px viewport, open a public or custom group → `افزودن → صورت‌بها`: selector fills the entire screen (not a small card at the bottom-left).
15. Tap `افزودن صورت‌بها` without selecting a project: validation message `ابتدا یک پروژه انتخاب کنید.` appears (not silent no-op).
16. When no projects exist: `افزودن صورت‌بها` opens the create-project sheet directly; empty state also shows `ایجاد پروژه جدید` button.
17. After creating a project: project auto-selects, document creation flow opens automatically.
18. Background page does not scroll while selector is open.
19. At 768px+ the selector appears as a centered dialog (not full-screen).
20. Project-linked group: `افزودن صورت‌بها` opens creation immediately without project selection.
