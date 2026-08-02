# Phase 12 — Approved Product and Architecture Decisions

این فایل مرجع تصمیم‌های غیرقابل‌تفسیر فاز ۱۲ است.

## 1. مرز مدیریت پلتفرم

- مدیریت پلتفرم از نقش‌های شرکتی `Owner/Manager/Employee` کاملاً مستقل است.
- Backend تنها مرجع تشخیص دسترسی است.
- فرانت فقط capabilityهای بازگشتی Backend را مصرف می‌کند.
- هیچ دسترسی مدیریتی از عنوان فارسی، نقش شرکتی، badge یا مسیر UI حدس زده نمی‌شود.

## 2. یک Superuser ریشه

- پلتفرم دقیقاً یک Superuser ریشه فعال دارد.
- Superuser به تمام capabilityهای پلتفرم دسترسی ضمنی دارد.
- Superuser از طریق پنل می‌تواند Adminهای دیگر را ایجاد، غیرفعال، فعال و دسترسی‌های آنان را تغییر دهد.
- هیچ Admin عادی—even با بیشترین capabilityهای عملیاتی—نمی‌تواند Admin دیگری بسازد، دسترسی مدیران را تغییر دهد یا Superuser را عوض کند.
- حذف، تعلیق یا جایگزینی Superuser تنها از مسیر انتقال ریشه امن، Step-up، reason، تراکنش و audit ممکن است.
- در تمام زمان‌ها invariant «دقیقاً یک Superuser فعال» حفظ می‌شود.

## 3. ایجاد Admin با شماره موبایل

- Superuser شماره موبایل کامل و دقیق را وارد می‌کند.
- Backend شماره را با همان normalization رسمی حساب‌ها نرمال می‌کند.
- فقط exact match مجاز است؛ partial search یا autocomplete شماره برای این عملیات لازم نیست.
- کاربر هدف باید موجود، فعال و قابل استفاده باشد.
- اگر کاربر وجود نداشته باشد، عملیات با خطای پایدار متوقف می‌شود؛ حساب جدید مخفیانه ساخته نمی‌شود.
- اگر کاربر از قبل Admin فعال باشد، duplicate ایجاد نمی‌شود.
- هنگام ایجاد Admin، Superuser capabilityهای اختیاری را انتخاب می‌کند.
- Admin جدید حداقل capabilityهای پایه تیکت را به‌صورت اجباری دریافت می‌کند.

## 4. مدل Admin و capability

- roleهای ثابت مانند `finance_admin` یا `support_admin` منبع دسترسی نیستند.
- هر Admin یک عضویت فعال و مجموعه‌ای از capability grantهای مستقیم دارد.
- Backend effective capabilities را از این موارد می‌سازد:
  1. capabilityهای پایه همه Adminها؛
  2. grantهای فعال و منقضی‌نشده؛
  3. دسترسی کامل ضمنی Superuser.
- revoke/expire شدن Admin یا grant بلافاصله دسترسی را قطع می‌کند.
- capabilityها از whitelist کد/دیتابیس معتبر انتخاب می‌شوند و client نمی‌تواند رشته دلخواه بسازد.

## 5. دسترسی پایه تیکت برای همه Adminها

هر Admin فعال همیشه این capabilityهای پایه را دارد و Superuser نمی‌تواند آن‌ها را از یک Admin فعال حذف کند:

```text
admin.dashboard.view
admin.tickets.view
admin.tickets.reply
```

بنابراین همه Adminهای فعال می‌توانند:

- لیست تیکت‌ها را ببینند؛
- جزئیات و پیام‌های عمومی تیکت را مشاهده کنند؛
- پاسخ عمومی برای کاربر ارسال کنند.

عملیات زیر capability جداگانه می‌خواهند:

- یادداشت داخلی
- ارجاع/تخصیص
- تغییر اولویت
- resolve/close/reopen

## 6. اختیار Superuser

Superuser به همه عملیات مجاز محصول دسترسی دارد؛ اما حتی او:

- رمز عبور، OTP، session cookie، recovery secret یا اطلاعات کارت را نمی‌بیند؛
- ledger، audit event، subscription event یا سفارش fulfilled را مستقیماً ویرایش/حذف نمی‌کند؛
- اصلاح مالی را فقط از serviceهای صریح انجام می‌دهد؛
- عملیات حساس را با Step-up و reason انجام می‌دهد؛
- break-glass وی صریح و audit می‌شود.

## 7. احراز هویت و Step-up

- session-cookie + CSRF فعلی مرورگر حفظ می‌شود.
- ورود عادی به محصول مجوز پنل مدیریت نیست.
- endpoint مدیریتی نیازمند active user و یکی از این دو حالت است:
  - Superuser ریشه فعال؛
  - Platform Admin فعال.
- عملیات حساس نیازمند Step-up با رمز فعلی است.
- هیچ admin token در localStorage/sessionStorage ذخیره نمی‌شود.

## 8. Audit

- هر mutation مدیریتی مؤثر audit append-only دارد.
- actor، effective capabilities، action، target، outcome، reason، request_id، زمان و diff امن ذخیره می‌شوند.
- ایجاد/ویرایش/لغو Admin و capability grantها همیشه audit می‌شود.
- رازها و محتوای حساس در diff یا log ذخیره نمی‌شوند.

## 9. بسته توکن و پلن اشتراک

- Superuser یا Admin دارای capability مربوطه می‌تواند بسته/پلن بسازد و ویرایش کند.
- تغییرات فقط روی خرید/فعال‌سازی آینده اثر دارند.
- snapshotهای سفارش‌ها و اشتراک‌های گذشته حفظ می‌شوند.
- package/plan استفاده‌شده hard-delete نمی‌شود؛ archive یا deactivate می‌شود.
- code استفاده‌شده immutable است.

## 10. سفارش، خرید و اصلاح مالی

- مدیر مجاز جزئیات سفارش، مبلغ، currency، snapshot بسته، تعداد توکن، provider reference امن و ledger مرتبط را می‌بیند.
- status سفارش به‌صورت دلخواه patch نمی‌شود.
- اصلاح مالی از مسیر adjustment صریح با reason و idempotency انجام می‌شود.
- requester/approver separation مطابق capabilityها حفظ می‌شود.
- Superuser فقط در break-glass با Step-up و audit می‌تواند self-approve کند.

## 11. سامانه تیکت

- کاربر فقط تیکت‌های خودش را می‌بیند.
- پیام کاربر، پاسخ عمومی Admin، یادداشت داخلی و system event از هم جدا هستند.
- یادداشت داخلی هرگز به API کاربر نشت نمی‌کند.
- همه Adminها می‌توانند پاسخ عمومی بدهند.
- بستن تیکت حذف اطلاعات نیست و hard-delete API وجود ندارد.

## 12. کاربران و شرکت‌ها

- suspend/reactivate و انتقال مالکیت عملیات service-based و audit شده‌اند.
- suspend کاربر sessionهای فعال او را لغو می‌کند.
- Admin هرگز رمز کاربر را مشاهده یا دلخواه تنظیم نمی‌کند.

## 13. حذف و تاریخچه

موارد زیر از پنل hard-delete نمی‌شوند:

- audit events
- wallet transactions
- payment orders دارای تاریخچه
- applied adjustments
- subscription events
- support messages
- تاریخچه Admin/capability grantها

## 14. تست

- ابتدا focused tests.
- بک‌اند پس از focused green یک Full Suite نهایی اجرا می‌کند.
- فرانت focused tests + typecheck + lint + build اجرا می‌کند.
