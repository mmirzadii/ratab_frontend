# Phase 12 Security Model

## دارایی‌های حساس

- Superuser ریشه و Admin memberships
- capability grants و تاریخچه تفویض
- حساب کاربران و sessionها
- شماره موبایل و اطلاعات هویتی
- شرکت‌ها و عضویت‌ها
- کیف پول، ledger، سفارش‌ها و خریدها
- بسته‌ها و پلن‌های مالی
- تیکت‌ها، یادداشت‌های داخلی و فایل‌های خصوصی
- audit log

## تهدیدهای اصلی

- ایجاد Admin بدون اختیار Superuser
- self-escalation یا capability injection
- استفاده از partial phone search برای کشف حساب‌ها
- وجود صفر یا چند Superuser ریشه
- دسترسی role شرکتی به پنل پلتفرم
- IDOR روی کاربر، شرکت، سفارش، تیکت یا تراکنش
- CSRF، replay و double-submit
- تغییر مستقیم wallet balance یا order status
- نشت internal note یا attachment خصوصی
- Mass assignment در serializerهای مدیریتی
- حذف/ویرایش audit، ledger یا delegation history
- session سرقت‌شده برای عملیات حساس

## Authentication

- session-cookie فعلی
- CSRF برای mutationها
- active user
- root superuser یا active PlatformAdminMembership
- Step-up برای عملیات حساس
- rate limit روی login، step-up، admin promotion و مالی

## Authorization

مرجع واحد:

```text
PlatformAdminPolicy
```

Policy باید:

- Superuser را از root record معتبر تشخیص دهد؛
- Admin فعال/منقضی/لغوشده را بررسی کند؛
- baseline ticket capabilities را اضافه کند؛
- capability grantهای فعال را محاسبه کند؛
- object-level checks را اعمال کند.

هیچ View نباید role names یا شماره موبایل را پراکنده بررسی کند.

## Superuser-only boundary

endpointهای مدیریت Admin باید علاوه بر Step-up و CSRF صریحاً root-superuser-only باشند. capability مانند `admin.staff.manage` به Admin عادی واگذار نشود.

## Exact phone promotion

- normalization رسمی حساب‌ها
- exact lookup only
- target must exist and be active
- response حداقل داده لازم
- attemptها rate-limited و audited
- شماره کامل در log عمومی ثبت نشود؛ audit می‌تواند نسخه masked داشته باشد

## Step-up

حداقل برای:

- ایجاد/لغو/ویرایش Admin
- انتقال Superuser
- suspend/reactivate user/company
- revoke sessions
- transfer ownership
- تغییر قیمت/مقدار package/plan فعال
- adjustment مالی
- cancel order
- export حساس

## Audit

رویداد شامل:

- actor_id
- actor_type: superuser/admin
- effective capability snapshot
- action
- target_type/id
- request_id
- outcome
- reason
- safe before/after diff
- IP طبق سیاست حریم خصوصی
- user-agent خلاصه
- created_at

Redact:

- password/OTP
- session/csrf/token
- private storage key/URL
- payment secrets
- authorization headers
- شماره موبایل کامل در logهای عمومی

## Financial integrity

- Decimal
- transaction.atomic
- select_for_update
- idempotency key
- append-only ledger
- snapshot amount/currency/package/plan
- no direct balance update
- no direct fulfilled serializer
- requester/approver separation

## Ticket isolation

- user API فقط creator
- all active Admins may view/reply via baseline policy
- internal note requires separate capability and never enters user serializer
- attachments private and authorized
- body/MIME/size/count limited
- no raw storage URL

## Frontend rules

- route guard UX است؛ Backend security authoritative است
- `/api/platform-admin/me/` منبع identity/capabilities است
- Admin-management UI فقط برای `is_superuser=true`
- capabilityهای پایه تیکت در UI غیرقابل‌حذف نمایش داده شوند
- no admin token storage
- no optimistic financial/destructive mutation
