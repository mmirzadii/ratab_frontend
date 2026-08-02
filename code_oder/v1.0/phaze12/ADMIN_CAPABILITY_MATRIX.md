# Platform Admin Capability Matrix

این نسخه role-based نیست. Superuser همه capabilityها را دارد و برای هر Admin capabilityهای مستقیم تعیین می‌کند.

## دسترسی‌های پایه همه Adminهای فعال

| Capability | Superuser | هر Admin فعال | قابل حذف از Admin |
|---|:---:|:---:|:---:|
| `admin.dashboard.view` | ✓ | ✓ | خیر |
| `admin.tickets.view` | ✓ | ✓ | خیر |
| `admin.tickets.reply` | ✓ | ✓ | خیر |

## capabilityهای اختیاری

| حوزه | Capability | توضیح |
|---|---|---|
| کاربران | `admin.users.view` | جست‌وجو و مشاهده جزئیات امن |
| کاربران | `admin.users.suspend` | suspend/reactivate |
| کاربران | `admin.users.revoke_sessions` | لغو sessionها |
| شرکت‌ها | `admin.companies.view` | مشاهده شرکت‌ها |
| شرکت‌ها | `admin.companies.suspend` | suspend/restore |
| شرکت‌ها | `admin.companies.transfer_owner` | انتقال مالکیت با Step-up |
| کیف پول | `admin.wallets.view` | مشاهده balance و ledger |
| اصلاح مالی | `admin.wallets.adjust.request` | ثبت درخواست grant/debit/refund/reversal |
| اصلاح مالی | `admin.wallets.adjust.approve` | تأیید/رد/اعمال مطابق separation |
| بسته توکن | `admin.packages.view` | مشاهده بسته‌ها و usage |
| بسته توکن | `admin.packages.manage` | ایجاد/ویرایش/archive |
| پلن اشتراک | `admin.plans.view` | مشاهده پلن‌ها و usage |
| پلن اشتراک | `admin.plans.manage` | ایجاد/ویرایش/archive |
| اشتراک | `admin.subscriptions.view` | مشاهده اشتراک‌ها |
| اشتراک | `admin.subscriptions.manage` | activate/extend/cancel |
| سفارش | `admin.orders.view` | مشاهده سفارش و خرید |
| سفارش | `admin.orders.manage` | safe cancel/retry verification |
| تیکت | `admin.tickets.internal_note` | یادداشت داخلی |
| تیکت | `admin.tickets.assign` | assign/unassign |
| تیکت | `admin.tickets.manage_priority` | تغییر اولویت |
| تیکت | `admin.tickets.manage_status` | resolve/close/reopen |
| Audit | `admin.audit.view` | مشاهده audit |
| Audit | `admin.audit.export` | export محدود و audit شده |
| عملیات | `admin.operations.view` | health/readiness/pricebook/quota summary |

## عملیات انحصاری Superuser

این عملیات capability قابل واگذاری ندارند:

- ایجاد Admin با شماره موبایل
- ویرایش capabilityهای Admin
- revoke/reactivate Admin
- تعیین expiry مدیر
- مشاهده تاریخچه کامل delegation
- انتقال Superuser

## قواعد

- Backend effective capabilityها را برمی‌گرداند؛ فرانت این جدول را hardcode نمی‌کند.
- grant غیرفعال، منقضی یا revoke شده capability نمی‌دهد.
- تغییر capability نیازمند Step-up، reason و audit است.
- Adminهای فعال همیشه ticket view/reply دارند.
- capabilityهای مالی و destructive باید object-level policy هم داشته باشند.
