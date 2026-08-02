# Commerce Administration Specification

## Token Packages

Superuser یا Admin دارای `admin.packages.manage` می‌تواند:

- ایجاد بسته
- ویرایش عنوان/توضیح
- تعیین `token_amount`
- تعیین `price_amount`
- تعیین `currency`
- فعال/غیرفعال/archive
- ترتیب نمایش

قواعد:

- code یکتا و پس از اولین استفاده immutable
- token_amount مثبت
- price غیرمنفی و Decimal
- سفارش قبلی snapshot خود را حفظ می‌کند
- بسته استفاده‌شده hard-delete نمی‌شود

`admin.packages.view` فقط مشاهده را می‌دهد.

## Subscription Plans

Superuser یا Admin دارای `admin.plans.manage` می‌تواند:

- ایجاد پلن
- ویرایش عنوان/توضیح
- قیمت/currency
- مدت
- daily message limit
- attachment/file limit و entitlementهای موجود
- active/archive/display order

قواعد snapshot حفظ می‌شود. `admin.plans.view` read-only است.

## Payment Orders

`admin.orders.view`:

- order/public id
- user
- package snapshot
- token snapshot
- amount/currency
- status/provider/reference امن
- timestamps
- ledger link
- failure reason امن

`admin.orders.manage`:

- cancel فقط statusهای مجاز
- retry verification فقط provider adapter معتبر

ممنوع:

- PATCH مستقیم fulfilled
- تغییر snapshot
- حذف order دارای تاریخچه
- credit مستقیم wallet

## Wallet Adjustments

`admin.wallets.adjust.request` برای ثبت درخواست و `admin.wallets.adjust.approve` برای approval/apply.

مدل پیشنهادی:

- target user/wallet
- kind: grant/debit/refund/reversal
- amount
- reason
- reference
- requested_by
- approved_by
- status
- idempotency_key
- ledger transaction
- break_glass
- timestamps

Superuser all-access دارد ولی break-glass self-approval نیازمند Step-up، reason قوی و audit است.

## Revenue

- fulfilled amount per currency
- orders per status
- tokens sold
- adjustments
- active subscriptions

currencyهای مختلف بدون conversion رسمی جمع نشوند.
