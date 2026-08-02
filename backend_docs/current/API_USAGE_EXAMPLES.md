# API usage examples

Fake non-sensitive data only. Match `OPENAPI.yaml` and current serializers.
Assume cookies are included (`credentials: "include"`) and CSRF is set for
mutating calls.

## 1. CSRF bootstrap

```http
GET /api/auth/csrf/
```

```json
{"csrf_token": "masked-csrf-token-example"}
```

## 2. Signup start → verify → complete

```http
POST /api/auth/signup/start/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"phone_number": "09120000001"}
```

```json
{
  "challenge_id": "11111111-1111-1111-1111-111111111111",
  "phone_number": "09120000001",
  "expires_in_seconds": 300
}
```

```http
POST /api/auth/signup/verify/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "challenge_id": "11111111-1111-1111-1111-111111111111",
  "phone_number": "09120000001",
  "verification_code": "12345"
}
```

```json
{
  "signup_ticket": "opaque-one-time-ticket",
  "expires_in_seconds": 600
}
```

```http
POST /api/auth/signup/complete/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "signup_ticket": "opaque-one-time-ticket",
  "password": "abcdef",
  "password_confirmation": "abcdef",
  "display_name": "نمونه کاربر"
}
```

Backend password rule: minimum length **6**. Values such as `123456`, `abcdef`,
or common-looking six-plus-character passwords are accepted and hashed. Extra
strength UI is optional and non-blocking.

Example field error when the password is too short:

```json
{"password": ["This password is too short. It must contain at least 6 characters."]}
```

That response is JSON attached to `password`. It is **not** an invalid-ticket
error, and it does not consume the signup ticket.

Successful completion response:

```json
{
  "authenticated": true,
  "user": {
    "id": 10,
    "phone_number": "09120000001",
    "display_name": "نمونه کاربر",
    "is_active": true,
    "is_staff": false,
    "created_at": "2026-07-28T12:00:00+03:30",
    "updated_at": "2026-07-28T12:00:00+03:30"
  }
}
```

## 3. Login, me, logout

```http
POST /api/auth/login/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"phone_number": "09120000001", "password": "ExamplePass123!"}
```

```http
GET /api/auth/me/
```

```http
POST /api/auth/logout/
X-CSRFToken: masked-csrf-token-example
```

Logout success: **204** empty body.

## 4. Companies, invitations, and groups

```http
GET /api/companies/
GET /api/companies/1/groups/
GET /api/companies/1/members/
```

Company create returns `public_group_id` for the system `عمومی` group:

```http
POST /api/companies/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"name": "Example Co"}
```

```json
{
  "id": 1,
  "name": "Example Co",
  "public_group_id": 3,
  "owner_member_id": 10,
  "is_active": true
}
```

Group list pins the public group first (`group_type`, `pin_priority`), then
orders remaining conversations by `last_activity_at` (latest successful message,
else group `created_at`):

```http
GET /api/companies/1/groups/
```

```json
[
  {
    "id": 3,
    "name": "عمومی",
    "group_type": "public",
    "pin_priority": 0,
    "last_activity_at": "2026-07-29T10:00:00Z",
    "is_default": true,
    "project_id": null,
    "project": null
  },
  {
    "id": 9,
    "name": "Site A",
    "group_type": "project",
    "pin_priority": 1,
    "last_activity_at": "2026-07-29T12:30:00Z",
    "project_id": 5,
    "project": {"id": 5, "name": "Site A", "project_code": null, "status": "draft"}
  }
]
```

Project create (default includes all active company members in the linked group):

```http
POST /api/companies/1/projects/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"name": "Site A", "include_all_company_members_in_group": true}
```

```json
{
  "id": 5,
  "company_id": 1,
  "name": "Site A",
  "group_id": 9,
  "include_all_company_members_in_group": true,
  "status": "draft"
}
```

Omit `include_all_company_members_in_group` to get the same default (`true`).
Pass `false` to add only the creator; do not send a membership list.

Project-group settings edit (updates linked Project; syncs group display name):

```http
PATCH /api/company-groups/9/
Content-Type: application/json

{"name": "Site A Renamed", "description": "به‌روز شد", "employer_name": "کارفرما"}
```

Deletion preview then hard delete (ordinary custom group):

```http
GET /api/company-groups/12/deletion-preview/
DELETE /api/company-groups/12/
Content-Type: application/json

{"confirmation": "DELETE_GROUP"}
```

Project (or project-group) hard delete:

```http
GET /api/projects/5/deletion-preview/
DELETE /api/projects/5/
Content-Type: application/json

{"confirmation": "DELETE_PROJECT"}
```

Public group delete is always rejected:

```json
{"code": "PUBLIC_GROUP_DELETE_FORBIDDEN", "detail": "The company public group cannot be deleted."}
```

### Custom/normal group create (atomic)

Frontend collects name + selected active members, then submits once:

```http
POST /api/companies/1/groups/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "name": "Site Ops",
  "description": "عملیات سایت",
  "member_ids": [12, 15]
}
```

```json
{
  "group": {
    "id": 22,
    "name": "Site Ops",
    "description": "عملیات سایت",
    "group_type": "custom",
    "pin_priority": 2,
    "is_default": false
  },
  "creator_membership": {"id": 40, "member_id": 10, "is_active": true},
  "pending_invitation_count": 2,
  "invitations": [
    {"id": 31, "invited_user_id": 12, "target_group_id": 22, "status": "pending"}
  ],
  "skipped_already_member_ids": []
}
```

Member picker (active only; optional search):

```http
GET /api/companies/1/members/?active_only=true&q=علی
```

Selected members are invited (pending); they must accept via
`POST /api/company-invitations/{id}/accept/` before messaging access. The
creator is always an active member and is never invited. Invalid `member_ids`
reject the whole create (no partial group).

Pricebook family / year selection (then create FD with resolved ids):

```http
GET /api/pricebooks/
```

```json
[
  {
    "id": 1,
    "code": "building",
    "title_fa": "ابنیه",
    "official_title_fa": "فهرست‌بهای واحد پایه رشته ابنیه",
    "discipline": "building",
    "base_year": 1404,
    "sort_order": 10,
    "is_active": true,
    "latest_available_year": 1404
  }
]
```

```http
GET /api/pricebooks/1/editions/
```

```json
[
  {
    "id": 10,
    "pricebook_id": 1,
    "family_code": "building",
    "family_title_fa": "ابنیه",
    "code": "building-1404",
    "year": 1404,
    "title_fa": "فهرست‌بهای واحد پایه رشته ابنیه سال 1404",
    "currency_code": "IRR",
    "is_locked": true,
    "is_active": true,
    "is_stale": false,
    "is_base_year": true,
    "active_price_set": {
      "id": 20,
      "code": "official-1404",
      "title_fa": "قیمت‌های رسمی سال 1404",
      "is_active": true
    }
  }
]
```

List returns only active, non-stale editions (newest year first). Prefer create
with `pricebook_edition_ids` (server resolves each official PriceSet). Legacy
clients may still send `pricebook_edition_id` + `price_set_id` from that payload
— never treat `ABN1404` as the family code.

Project-group financial documents (linked project is authoritative):

```http
GET /api/company-groups/9/financial-documents/
POST /api/company-groups/9/financial-documents/
Content-Type: application/json

{"document_type": "cost_report", "title": "گزارش", "pricebook_edition_ids": [10, 12]}
```

Legacy single-edition create (still supported):

```json
{"document_type": "cost_report", "title": "گزارش", "pricebook_edition_id": 10, "price_set_id": 20}
```

Document detail includes `selected_pricebooks` (authoritative) and mirrors the
primary selection on singular `pricebook_edition_id` / `price_set_id`.

```http
GET /api/financial-documents/{id}/document-pricebooks/
POST /api/financial-documents/{id}/document-pricebooks/
{"pricebook_edition_id": 12}

DELETE /api/financial-documents/{id}/document-pricebooks/{selection_id}/
```

When creating a pricebook line on a multi-selection document, include
`document_pricebook_id` (required). Single-selection documents may omit it.

Stale or inactive edition on create/add (HTTP 400):

```json
{"pricebook_edition_id": ["Pricebook edition is inactive or stale and cannot be used for document pricebook selections."]}
```

Missing selection on multi-edition document line create (HTTP 400):

```json
{"document_pricebook_id": ["document_pricebook_id is required when multiple pricebooks are selected."]}
```

Then attach with the single message-attachment flow:

```http
POST /api/company-groups/9/messages/
Content-Type: application/json

{"attachments": [{"attachment_type": "financial_document", "resource_id": 40}]}
```

Public/custom groups require explicit `project_id` on the group FD endpoints.

Shared resources (active members only, paginated):

```http
GET /api/company-groups/3/shared-resources/financial-documents/
GET /api/company-groups/3/shared-resources/files/
GET /api/company-groups/3/shared-resources/links/
```

Invite a registered non-member (pending invitation; no access yet):

```http
POST /api/companies/1/members/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"phone_number": "09120000002", "role": "employee", "group_id": 3}
```

```json
{
  "outcome": "invitation_pending",
  "invitation": {
    "id": 12,
    "company_id": 1,
    "target_group_id": 3,
    "proposed_role": "employee",
    "status": "pending"
  },
  "company_member": null,
  "group_membership": null,
  "company": {"id": 1, "name": "Example Co"},
  "group": {"id": 3, "name": "عمومی"}
}
```

Invitee pending list / accept:

```http
GET /api/company-invitations/
```

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 12,
      "company_id": 1,
      "company_name": "Example Co",
      "invited_user_id": 20,
      "status": "pending",
      "target_group_id": 3,
      "proposed_role": "employee"
    }
  ]
}
```

Compatibility aliases for the same pending list:

- `GET /api/auth/me/invitations/`
- `GET /api/me/invitations/`
- `GET /api/membership-invitations/`

```http
POST /api/company-invitations/12/accept/
```

Acceptance returns `outcome: "invitation_accepted"` plus `company_member`,
`group_membership`, `company`, and `group`. Rejection uses
`POST /api/company-invitations/12/reject/` and creates no memberships.

If the phone already belongs to an active company member, the same members POST
adds them to the target group (`outcome: "group_membership_added"` or
`already_group_member`) without creating an invitation.

Paginated company lists use `{count, next, previous, results}` with page size 50.

Ownership transfer (owner only; previous owner becomes admin):

```http
POST /api/companies/1/transfer-ownership/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"member_id": 22}
```

Member settings (GET returns live switches; PATCH persists role and/or
`permission_settings`):

```http
GET /api/company-members/22/settings/
```

```http
PATCH /api/company-members/22/settings/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"role": "admin", "permission_settings": {"can_add_admins": true}}
```

Member list/detail/settings rows include authorization and switch metadata:

```json
{
  "role": "admin",
  "permission_settings": {
    "can_add_admins": false,
    "can_manage_company_profile": true,
    "can_manage_invitations": true,
    "can_deactivate_employees": true,
    "can_manage_all_custom_groups": true
  },
  "inherited_permissions": {
    "can_invite_employees": true,
    "can_create_projects": true
  },
  "effective_permissions": {
    "can_invite_employees": true,
    "can_add_admins": false
  },
  "configurable_permissions": [
    {
      "key": "can_add_admins",
      "label_fa": "افزودن مدیر جدید",
      "type": "boolean",
      "default": false,
      "value": false
    }
  ],
  "can_edit_member": true,
  "can_change_role": true,
  "assignable_roles": ["admin", "employee"],
  "edit_denied_reason": null
}
```

Owner rows return empty `permission_settings` / `configurable_permissions`,
`can_edit_member: false`, `assignable_roles: []`, and
`edit_denied_reason: "owner_not_editable"`. Admin settings never expose Employee
keys as editable switches; those appear under `inherited_permissions` /
`effective_permissions` only.

## 5. Message create, lifecycle, and quota exceeded

```http
POST /api/company-groups/3/messages/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "text": "سلام، سند پیوست شد",
  "attachments": [],
  "client_message_id": "client-msg-001"
}
```

Successful create returns the persisted message including `id`, `created_at`
(server-confirmed sent timestamp — **not** a read receipt), `can_edit`,
`can_delete`, `can_forward`, `is_edited`, and `is_deleted`.

```http
PATCH /api/group-messages/42/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"text": "متن ویرایش‌شده"}
```

```http
DELETE /api/group-messages/42/
X-CSRFToken: masked-csrf-token-example
```

Soft-delete response keeps the row as a tombstone (`text` = `پیام حذف شد`,
`attachments` = `[]`, `is_deleted` = true).

```http
POST /api/group-messages/42/forward/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"target_group_id": 9, "client_message_id": "fwd-001"}
```

Forward creates one new message in the target group (the source group is also
an allowed target), consumes one quota slot, and includes `forwarded_from`
with an immutable source summary. Same-group forward keeps the original
message unchanged and returns a distinct message `id`.

Allowed attachment types: `file`, `financial_document` only. Sending
`attachment_type: "project"` returns **400** (`project_attachment_disabled`).

Quota exceeded example (user has no paid subscription, so the effective plan
is the Bronze fallback):

```json
{
  "code": "MESSAGE_QUOTA_EXCEEDED",
  "detail": "The daily message limit for this account is reached.",
  "used_today": "20",
  "daily_limit": "20",
  "quota_date": "2026-07-28",
  "resets_at": "2026-07-29T00:00:00+03:30",
  "effective_plan_code": "bronze"
}
```

HTTP **429** on create or forward. Edit/delete never consume quota.

## 6. File upload and private download

```http
POST /api/companies/1/files/
Content-Type: multipart/form-data
X-CSRFToken: masked-csrf-token-example

file=@notes.txt
```

```http
GET /api/storage-files/42/download/
```

Binary response with attachment disposition. No public URL field.

## 7. Official calculation billing → receipt → free line create

Official items keep automatic calculation. Tokens are charged once per open
item modal session (first successful calculation), not once per changed
payload. Opening the modal is free.

```http
POST /api/financial-documents/7/official-calculation-sessions/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "pricebook_item_id": 100
}
```

Success: HTTP **201**, no debit.

```json
{
  "calculation_session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "document_id": 7,
  "pricebook_item_id": 100,
  "company_id": 1,
  "is_paid": false,
  "expires_at": "2026-07-30T13:00:00+03:30",
  "official_calculation_cost": "2"
}
```

`idempotency_key` is **required** on each calculation request. After the user
enters a complete valid input set, the frontend should auto-send calculation
(after debounce) with the session id from above.

```http
POST /api/financial-documents/7/official-calculations/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "calculation_session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pricebook_item_id": 100,
  "quantity": "1",
  "idempotency_key": "calc-7-100-20260730-a1"
}
```

Success (first success in the session): HTTP **201**, applied_cost **2**.

```json
{
  "result": {"unit_price": "120000", "total": "120000"},
  "receipt": {
    "id": 501,
    "calculation_type": "official",
    "document_id": 7,
    "company_id": 1,
    "pricebook_item_id": 100,
    "session_id": 12,
    "applied_cost": "2",
    "personal_debit": "2",
    "company_debit": "0",
    "line_id": null,
    "idempotency_key": "calc-7-100-20260730-a1",
    "created_at": "2026-07-30T09:00:00+03:30"
  },
  "billing": {"applied_cost": "2", "personal_debit": "2", "company_debit": "0"},
  "personal_balance": "10",
  "company_balance": "0",
  "replayed": false,
  "calculation_session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

Later successful recalculations in the **same** open session (new
`idempotency_key`, changed quantity/inputs) return applied_cost **0** and a
new latest receipt — no second debit. Exact replay of the same key + payload:
HTTP **200**, `replayed: true`, same `receipt.id`. Closing the modal and
opening again requires a new session; the first success may charge again.

The equivalent standalone starred-calculation endpoint is
`POST /api/financial-documents/7/starred-calculations/` with
`{"quantity", "unit_price", "description", "unit", "idempotency_key"}` and
defaults to **1** token per successful starred calculation (no modal session).

`POST /api/pricebook-items/100/calculate/` bills the same official session rule
and requires `financial_document_id` + `calculation_session_id` +
`idempotency_key`.

Now materialize the line from the **latest** paid receipt — **free**:

```http
POST /api/financial-documents/7/lines/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "calculation_receipt_id": 501,
  "idempotency_key": "line-from-receipt-501"
}
```

Success: HTTP **201** line payload. Wallet balance is **unchanged** by this
call. Stale (superseded) receipts return **400**. Exact replay of the same
`calculation_receipt_id` returns the original line with HTTP **200** and header
`Idempotent-Replayed: true`.

### Add without a fresh receipt (fallback)

The Add button may remain clickable when no fresh receipt exists. Send the
same official calculation inputs plus a required `idempotency_key`:

```http
POST /api/financial-documents/7/lines/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{
  "pricebook_item_id": 100,
  "quantity": "1",
  "idempotency_key": "add-fallback-7-100-a1"
}
```

Behavior:

- sufficient balance → open/reuse session, at most one official debit
  (default 2 for that session), receipt, then free line create (HTTP **201**);
- insufficient balance → HTTP **402** `INSUFFICIENT_COMBINED_TOKEN_BALANCE`
  (includes `calculation_session_id` when a session exists), no usable
  result/receipt/line/debit;
- invalid/incomplete inputs → structured **400** validation errors (not 402);
- exact retry of the same key + payload → original line, HTTP **200**, no
  second debit.

Prefer calc-then-`calculation_receipt_id` when the UI already holds a fresh
latest receipt. Standalone starred lines without any pricebook item may still be
created directly with `manual_unit_price` and no receipt.

## 8. Company wallet, donations, and wallet summaries

```http
GET /api/token-wallet/
```

```json
{
  "balance": "13",
  "official_calculation_cost": "2",
  "starred_calculation_cost": "1",
  "token_packages": [],
  "commerce": {
    "demo_purchase_available": false,
    "online_payments_enabled": false,
    "purchasing_disabled": true,
    "mode": "disabled"
  },
  "created_at": "2026-07-01T00:00:00+03:30",
  "updated_at": "2026-07-30T09:00:00+03:30"
}
```

New accounts receive `new_account_initial_grant` tokens (default **12**) once,
at signup. The `13` above is illustrative — e.g. after demo/admin credit and
spend from the 12-token starting grant.

```http
GET /api/companies/1/token-wallet/
```

```json
{
  "company_id": 1,
  "company_name": "Example Co",
  "balance": "40",
  "is_active_member": true,
  "donation_allowed": true,
  "personal_balance": "13",
  "official_calculation_cost": "2",
  "starred_calculation_cost": "1",
  "fallback_available": true,
  "updated_at": "2026-07-30T09:00:00+03:30"
}
```

Donate personal tokens into the company wallet:

```http
POST /api/companies/1/token-donations/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"amount": "10", "idempotency_key": "donate-1-2026-07-30-a1"}
```

```json
{
  "donation": {
    "id": 8,
    "company_id": 1,
    "donor_user_id": 10,
    "donor_member_id": 3,
    "amount": "10",
    "idempotency_key": "donate-1-2026-07-30-a1",
    "created_at": "2026-07-30T09:05:00+03:30"
  },
  "personal_balance": "3",
  "company_balance": "50"
}
```

HTTP **201**; exact replay → **200** + `Idempotent-Replayed: true`. Donation
history (`GET /api/companies/1/token-donations/`): owners/admins see all;
other members see their own donations.

## 9. Insufficient balance

Calculation billing (personal + company combined):

```json
{
  "code": "INSUFFICIENT_COMBINED_TOKEN_BALANCE",
  "detail": "Neither the personal wallet nor the company wallet has enough combined balance for this calculation.",
  "required_tokens": "2",
  "personal_balance": "0",
  "company_balance": "1",
  "total_available": "1",
  "calculation_type": "official",
  "official_calculation_cost": "2",
  "company_id": 1
}
```
```

HTTP **402**.

Donation (personal only — donations never draw from the company wallet):

```json
{
  "code": "INSUFFICIENT_PERSONAL_TOKEN_BALANCE",
  "detail": "The personal token wallet does not have enough balance.",
  "required_tokens": "10",
  "available_tokens": "3"
}
```

HTTP **402**.

## 10. Subscription and quota reads

Every user has exactly one effective plan: a valid paid subscription, or
Bronze as the free fallback (no `UserSubscription` row required).

```http
GET /api/subscription/
```

No paid subscription — Bronze is effective:

```json
{
  "has_active_subscription": false,
  "has_paid_subscription": false,
  "effective_plan_code": "bronze",
  "effective_plan_title_fa": "برنزی",
  "is_free_fallback": true,
  "plan_code": "bronze",
  "plan_title_fa": "برنزی",
  "status": "free_fallback",
  "starts_at": null,
  "ends_at": null,
  "effective_daily_message_limit": 20,
  "effective_max_attachment_bytes": 10485760
}
```

With an active paid Silver subscription:

```json
{
  "has_active_subscription": true,
  "has_paid_subscription": true,
  "effective_plan_code": "silver",
  "effective_plan_title_fa": "نقره‌ای",
  "is_free_fallback": false,
  "plan_code": "silver",
  "plan_title_fa": "نقره‌ای",
  "status": "active",
  "starts_at": "2026-07-01T00:00:00+03:30",
  "ends_at": "2026-07-31T00:00:00+03:30",
  "effective_daily_message_limit": 500,
  "effective_max_attachment_bytes": 52428800
}
```

```http
GET /api/message-quota/
```

```json
{
  "quota_date": "2026-07-30",
  "used_today": 3,
  "daily_limit": 20,
  "remaining": 17,
  "resets_at": "2026-07-31T00:00:00+03:30",
  "plan_code": "bronze",
  "subscription_status": "free_fallback"
}
```

```http
GET /api/subscription-plans/
```

Catalog rows always include bronze + silver + gold together. Exactly one row
has `is_current: true` (here, Bronze, because there is no paid subscription):

```json
[
  {
    "code": "bronze",
    "title_fa": "برنزی",
    "daily_message_limit": 20,
    "max_attachment_bytes_per_message": 10485760,
    "duration_days": 36500,
    "price_amount": "0.0000",
    "currency": "IRR",
    "display_order": 10,
    "is_available": true,
    "is_current": true,
    "is_free_fallback": true,
    "can_activate": false
  },
  {
    "code": "silver",
    "title_fa": "نقره‌ای",
    "daily_message_limit": 500,
    "max_attachment_bytes_per_message": 52428800,
    "duration_days": 30,
    "price_amount": "299000.0000",
    "currency": "IRR",
    "display_order": 20,
    "is_available": true,
    "is_current": false,
    "is_free_fallback": false,
    "can_activate": true
  },
  {
    "code": "gold",
    "title_fa": "طلایی",
    "daily_message_limit": null,
    "max_attachment_bytes_per_message": null,
    "duration_days": 30,
    "price_amount": "0.0000",
    "currency": "IRR",
    "display_order": 30,
    "is_available": false,
    "is_current": false,
    "is_free_fallback": false,
    "can_activate": false
  }
]
```

Gold is `is_available: false` (unavailable) and therefore never `can_activate`
or `is_current`, regardless of subscription state.

```http
GET /api/token-wallet/
```

## 11. Disabled payment

```http
POST /api/payments/orders/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"package_code": "tokens-100", "idempotency_key": "pay-try-1"}
```

```json
{
  "code": "PAYMENTS_DISABLED",
  "detail": "Online payment is disabled. Token grants and subscriptions are activated manually by an administrator."
}
```

HTTP **503**. Do not send amount, token count, status, or success flags.

## 12. Demo token purchase (Local/Development only)

Read packages and capability from the wallet first:

```http
GET /api/token-wallet/
```

```json
{
  "balance": "0",
  "official_calculation_cost": "2",
  "starred_calculation_cost": "1",
  "token_packages": [
    {
      "code": "tokens_5",
      "title_fa": "بسته ۵ توکنی",
      "token_amount": "5",
      "price_amount": "499000.0000",
      "currency": "IRR",
      "display_order": 10,
      "is_active": true
    }
  ],
  "commerce": {
    "demo_purchase_available": true,
    "online_payments_enabled": false,
    "purchasing_disabled": false,
    "mode": "demo"
  }
}
```

When `commerce.demo_purchase_available` is true:

```http
POST /api/payments/demo-purchase/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"package_code": "tokens_5", "idempotency_key": "buy-tokens5-1"}
```

```json
{
  "order": {
    "id": 12,
    "status": "fulfilled",
    "package_code_snapshot": "tokens_5",
    "token_amount_snapshot": "5",
    "price_amount_snapshot": "499000.0000",
    "currency_snapshot": "IRR",
    "provider": "demo",
    "fulfilled_at": "2026-07-30T10:00:00+03:30",
    "created_at": "2026-07-30T10:00:00+03:30"
  },
  "wallet_balance": "5"
}
```

HTTP **201** on first success. Exact replay → **200** +
`Idempotent-Replayed: true` (no second credit). Same key with another package
→ **409** `IDEMPOTENCY_KEY_REUSED`. Never invent balance in the UI.

## Platform admin (Phase 12)

```http
GET /api/platform-admin/me/
```

```json
{
  "is_platform_admin": true,
  "is_superuser": false,
  "baseline_capabilities": [
    "admin.dashboard.view",
    "admin.tickets.view",
    "admin.tickets.reply"
  ],
  "granted_capabilities": ["admin.orders.view"],
  "capabilities": [
    "admin.dashboard.view",
    "admin.orders.view",
    "admin.tickets.reply",
    "admin.tickets.view"
  ],
  "step_up": {"verified": false, "expires_at": null}
}
```

```http
POST /api/platform-admin/step-up/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"password": "***"}
```

```http
POST /api/platform-admin/superuser/admin-candidates/lookup-by-phone/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"phone_number": "0912xxxxxxx"}
```

Superuser-only. Exact normalized match of an existing active user. Baseline
ticket capabilities are added by the backend and are not client-controlled.

## Support tickets (user)

```http
POST /api/support/tickets/
Content-Type: application/json
X-CSRFToken: masked-csrf-token-example

{"subject": "Billing question", "category": "billing", "body": "Need help"}
```

User APIs never include `internal_note` messages.
