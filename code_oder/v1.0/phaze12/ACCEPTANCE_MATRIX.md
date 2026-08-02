# Phase 12 Acceptance Matrix

| حوزه | معیار پذیرش |
|---|---|
| Superuser | دقیقاً یک root Superuser فعال وجود دارد |
| Bootstrap | root فقط از command امن یا transfer معتبر ساخته/جابه‌جا می‌شود |
| Admin promotion | Superuser با شماره کامل exact-match کاربر موجود را Admin می‌کند |
| Delegation | capabilityهای هر Admin جزئی، whitelist شده، تاریخ‌دار و audit شده‌اند |
| Exclusive control | هیچ Admin عادی مدیریت Adminها یا Superuser را ندارد |
| Baseline ticket | هر Admin فعال ticket view/reply دارد حتی بدون grant اختیاری |
| Ticket advanced | note/assign/priority/status طبق capability جدا کنترل می‌شود |
| Company roles | Owner/Manager/Employee دسترسی Platform Admin نمی‌دهند |
| Step-up | عملیات حساس بدون Step-up رد می‌شوند |
| Audit | mutationهای مهم success/denied/failed audit دارند |
| Audit immutability | audit و delegation history قابل حذف/ویرایش نیستند |
| User | view/suspend/reactivate/revoke sessions امن است |
| Company | view/suspend/restore/transfer owner امن است |
| Package | create/edit/archive ممکن و snapshot قبلی محفوظ است |
| Plan | create/edit/archive ممکن و snapshot اشتراک محفوظ است |
| Orders | جزئیات خرید/provider/ledger قابل مشاهده و direct fulfillment ممنوع است |
| Adjustment | reason/idempotency/approval/service-based است |
| Ticket user | کاربر فقط own tickets را می‌بیند |
| Internal note | هرگز به user API نشت نمی‌کند |
| Attachments | private و authorization شده‌اند |
| Frontend guard | me/capabilities authoritative است |
| Superuser UI | phone lookup، admin create/edit/revoke و capability groups دارد |
| Admin UI | بخش Support برای همه Adminها دیده می‌شود |
| Pagination | لیست‌ها server-side هستند |
| Secrets | password/OTP/session/storage/payment secrets نشت نمی‌کنند |
| OpenAPI | zero errors |
| Backend tests | focused + one full suite green |
| Frontend tests | focused + typecheck + lint + build green |
| Documentation | project explain/handoff/reports به‌روز است |
