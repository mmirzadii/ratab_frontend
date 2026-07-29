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

No new backend decisions required. Group members listing uses existing `GET /api/company-groups/{id}/members/`.
