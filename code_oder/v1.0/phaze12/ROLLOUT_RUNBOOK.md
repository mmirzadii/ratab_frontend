# Phase 12 Rollout and Data-Safety Runbook

## 1. پیش از تغییر

- PostgreSQL backup
- migration plan
- counts کاربران، شرکت‌ها، کیف پول‌ها، سفارش‌ها، packages، plans و subscriptions
- audit auth/session/commerce code
- no flush/reset

## 2. Migration order

1. singleton/root Superuser model or validated root authority
2. PlatformAdminMembership
3. capability grant/history
4. admin audit
5. support tickets
6. financial adjustments
7. additive package/plan fields if needed
8. indexes/constraints

هیچ کاربر موجودی خودکار Admin نشود.

## 3. Bootstrap اولین Superuser

فقط management command امن:

```text
python manage.py bootstrap_platform_superuser \
  --phone-number <existing-active-user-phone> \
  --reason "Initial Phase 12 root bootstrap"
```

Command باید:

- exact normalized phone بخواهد؛
- user موجود/active را بخواهد؛
- اگر root وجود دارد بدون flag recovery/transfer تغییر ندهد؛
- singleton invariant را enforce کند؛
- audit ایجاد کند؛
- idempotent باشد؛
- secret/phone واقعی را در docs چاپ نکند.

## 4. ایجاد Admin پس از Bootstrap

Superuser از پنل:

1. Step-up
2. exact phone lookup
3. preview user
4. select capabilities
5. reason/confirm
6. create membership/grants

Baseline ticket view/reply خودکار است.

## 5. Contract sync

```text
ratab_backend/codexphaze/frontend_docs/*
  -> ratab_frontend/backend_docs/current/*
```

سپس `npm run generate:api`.

## 6. Test order

Backend:

1. root singleton/bootstrap/transfer
2. admin exact-phone promotion/capability/revoke/expiry
3. baseline ticket access for every Admin
4. step-up/audit/CSRF
5. commerce/admin actions
6. ticket isolation/internal note
7. migrations/concurrency/idempotency
8. OpenAPI
9. one final Full Suite

Frontend:

1. route/me/capability guard
2. superuser admin-management flow
3. package/plan/order/adjustment
4. ticket user/admin flows
5. step-up
6. typecheck/lint/build

## 7. Production safety

- HTTPS/Secure/HttpOnly/SameSite
- admin mutation rate limits
- exact phone lookup rate limits
- backup/restore tested
- audit retention
- documented Superuser recovery/transfer procedure
- no second root account
- periodic capability review

## 8. Rollback

- migration rollback only after compatibility review
- never delete audit/ledger/orders/delegation history
- frontend feature flag may hide admin routes while backend security remains
