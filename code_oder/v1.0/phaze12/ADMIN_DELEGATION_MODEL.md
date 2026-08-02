# Superuser and Delegated Admin Model

## هدف

مدل مدیریت پلتفرم باید ساده، قابل فهم و امن باشد:

```text
Exactly one Platform Superuser
        ↓
Creates/updates Platform Admins by exact phone number
        ↓
Assigns granular capabilities
        ↓
All active Admins automatically get ticket view/reply
```

## مدل مفهومی پیشنهادی

نام دقیق مدل‌ها باید با convention پروژه تطبیق داده شود.

### PlatformRootSuperuser

Singleton/unique active root:

- user (OneToOne)
- activated_at
- activated_by bootstrap/transfer metadata
- transfer_reason
- timestamps

قواعد:

- دقیقاً یک رکورد فعال در هر لحظه
- target user active است
- تغییر فقط با transaction + lock + Step-up + reason + audit
- Django `is_superuser` به‌تنهایی منبع authority نباشد مگر audit کد ثابت کند که invariant دقیقاً یک ریشه را تضمین می‌کند

### PlatformAdminMembership

- user (unique active membership)
- is_active
- granted_by_superuser
- grant_reason
- starts_at
- expires_at nullable
- revoked_by_superuser
- revoked_at
- revocation_reason
- timestamps

### PlatformAdminCapabilityGrant

- admin_membership
- capability_code از whitelist
- granted_by_superuser
- reason
- starts_at
- expires_at nullable
- revoked_at/revoked_by/revocation_reason
- timestamps

## capabilityهای پایه غیرقابل‌حذف

برای Admin فعال:

```text
admin.dashboard.view
admin.tickets.view
admin.tickets.reply
```

این capabilityها در grant table ذخیره نشوند یا اگر ذخیره می‌شوند، حذف آن‌ها اثری روی baseline نداشته باشد.

## چرخه ایجاد Admin

1. Superuser Step-up می‌کند.
2. شماره کامل وارد می‌شود.
3. Backend normalize و exact lookup می‌کند.
4. preview حداقل داده لازم کاربر را برمی‌گرداند.
5. Superuser capabilityهای اضافی را انتخاب می‌کند.
6. confirm + reason ارسال می‌شود.
7. membership و grants در یک transaction ساخته می‌شوند.
8. audit ثبت می‌شود.
9. sessionهای هدف در صورت سیاست لازم refresh/revoke می‌شوند تا دسترسی جدید واضح اعمال شود.

## چرخه ویرایش Admin

- فقط Superuser
- Step-up + reason
- add/revoke capability
- active/inactive
- expires_at
- revoke Admin
- history read-only

## انتقال Superuser

برای جلوگیری از lockout، یکی از این دو مسیر پیاده شود:

1. endpoint اختصاصی `transfer-superuser` فقط برای Superuser فعلی؛ یا
2. management command امن برای recovery/transfer.

انتقال باید:

- target را exact phone یا user id معتبر بگیرد؛
- target active باشد؛
- در یک transaction root را جابه‌جا کند؛
- هیچ لحظه‌ای صفر یا دو root فعال نداشته باشد؛
- درباره باقی‌ماندن root قبلی به‌عنوان Admin تصمیم صریح بگیرد؛
- audit کامل ایجاد کند.

## ممنوعیت‌ها

- Admin عادی نمی‌تواند Admin دیگری بسازد.
- Admin عادی نمی‌تواند capability مدیران را ببیند/ویرایش کند مگر endpoint read محدود صریحاً تصویب شود؛ پیش‌فرض فقط Superuser.
- Admin نمی‌تواند خودش را ارتقا دهد.
- client نمی‌تواند capability ناشناخته ارسال کند.
- promotion بر اساس partial phone search یا name guess انجام نمی‌شود.
