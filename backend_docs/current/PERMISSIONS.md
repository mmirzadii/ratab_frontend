# Permissions — backend-enforced matrix

Backend version: `v1.0` cumulative. UI may hide actions; **security is enforced
by the backend**. Knowing a raw numeric ID never grants access.

Roles (only): `owner` > `admin` > `employee`.

A company always has **exactly one active owner**. Ownership changes only through
`POST /api/companies/{id}/transfer-ownership/`. Ordinary role/invite APIs cannot
assign `owner`.

## Role-scoped permission catalogs

Configurable boolean switches only. Unknown keys and cross-role keys are
rejected.

### Employee configurable catalog

| Key | Default | label_fa |
| --- | :---: | --- |
| `can_invite_employees` | `true` | افزودن کارمند جدید |
| `can_create_projects` | `true` | ایجاد پروژه |
| `can_update_projects` | `true` | ویرایش پروژه |
| `can_delete_projects` | `true` | حذف پروژه |
| `can_create_custom_groups` | `true` | ایجاد گروه سفارشی |
| `can_delete_custom_groups` | `true` | حذف گروه سفارشی |
| `can_create_financial_documents` | `true` | ایجاد سند مالی |
| `can_edit_unlocked_financial_documents` | `true` | ویرایش سند مالی قفل‌نشده |
| `can_upload_private_files` | `true` | آپلود فایل خصوصی |
| `can_attach_private_files` | `true` | پیوست فایل خصوصی |
| `can_attach_financial_documents` | `true` | پیوست سند مالی |

Employee `inherited_permissions` (baseline, not switches):
`can_view_company`, `can_access_public_group`, `can_view_joined_groups`,
`can_participate_in_joined_groups` — always true for active members.

### Admin-specific configurable catalog

Admin **inherits every Employee capability automatically**. Employee keys are
**not** duplicated as Admin switches and are **not** stored on Admin members.

| Key | Default | label_fa |
| --- | :---: | --- |
| `can_add_admins` | `false` | افزودن مدیر جدید |
| `can_manage_company_profile` | `true` | مدیریت اطلاعات عملیاتی شرکت |
| `can_manage_invitations` | `true` | مدیریت دعوت‌نامه‌ها |
| `can_deactivate_employees` | `true` | غیرفعال‌سازی یا حذف کارمند |
| `can_manage_all_custom_groups` | `true` | مدیریت همه گروه‌های سفارشی |
| `can_delete_employee_messages` | `false` | حذف پیام‌های کارمندان |

Admin message moderation:

- Every role may edit **only** messages they originally sent.
- Employee may soft-delete **only** their own messages.
- Admin may always soft-delete their own messages; may soft-delete an
  Employee message only when `can_delete_employee_messages` is true.
- Admin must **not** soft-delete Owner or other Admin messages through that
  capability.
- Owner may soft-delete any normal human-authored message in company groups.
- Frontend must use backend `can_edit` / `can_delete` / `can_forward` fields;
  do not reconstruct moderation from role names alone.

### Owner

Owner permissions are implicit and complete (every Employee + Admin capability).
No configurable switches; ordinary settings are read-only.

## Settings API fields

Member list/detail/settings responses include:

- `role`
- `permission_settings` — stored switches for the target role only
- `inherited_permissions` — baseline (Employee) or all Employee keys (Admin)
- `effective_permissions` / `permissions` — inherited + configurable result
- `configurable_permissions` / `permission_catalog` — editable rows with
  `key`, `label_fa`, `type`, `default`, `value`
- `can_edit_member` / `can_change_role`
- `assignable_roles`
- `edit_denied_reason`

Load/update: `GET|PATCH /api/company-members/{id}/settings/`
PATCH accepts `permission_settings` (preferred) or `permissions`.

## Actor → target management matrix

| Actor | Owner target | Admin target | Employee target |
| --- | :---: | :---: | :---: |
| Owner | no (transfer only) | Admin-specific switches only | full Employee catalog |
| Admin | no | no | full Employee catalog; promote if `can_add_admins` |
| Employee | no | no | no |

## Role transitions

- Employee → Admin: drop Employee stored overrides; inherit all Employee
  capabilities; initialize Admin defaults (`can_add_admins=false` unless Owner
  supplies a valid Admin payload).
- Admin → Employee: drop Admin-only keys; initialize Employee defaults.
- Ownership transfer: previous owner → Admin with Admin defaults.

## Company workspace

| Action | Employee | Admin | Owner |
| --- | :---: | :---: | :---: |
| Invite employee | if `can_invite_employees` | Y (inherited) | Y |
| Invite admin | N | if `can_add_admins` | Y |
| Create project / custom group / FD / upload / attach | if Employee switches | inherited | Y |
| Update company / slug | N | if `can_manage_company_profile` | Y |
| Manage invitations | N | if `can_manage_invitations` | Y |
| Deactivate/remove employees | N | if `can_deactivate_employees` | Y |
| Manage any custom group | creator path only | if `can_manage_all_custom_groups` | Y |
| Transfer ownership | N | N | Y |

## Token wallet and calculation billing access

Token wallet reads and company donations are **not** gated by the
Employee/Admin/Owner permission catalogs above — any active internal company
member has the same access regardless of role:

| Action | Employee | Admin | Owner |
| --- | :---: | :---: | :---: |
| Read own personal wallet (`GET /api/token-wallet/`) | Y | Y | Y |
| Read company wallet (`GET /api/companies/{id}/token-wallet/`) | Y (active member) | Y | Y |
| Read company donation history | Own donations | All | All |
| Donate personal tokens to the company wallet | Y (active member) | Y | Y |
| Run official/starred calculations, create lines | if document edit permission | if document edit permission | Y |
| Edit `TokenBillingPolicy` costs / initial grant | N | N | N (Django admin/staff only) |

`TokenBillingPolicy` (official/starred calculation costs and the new-account
signup grant) is editable only through Django admin by staff users, not
through any company-role permission — company owners cannot change these
costs for their own company.

## Subscription and quota reads

`GET /api/subscription-plans/`, `GET /api/subscription/`, and
`GET /api/message-quota/` require only authentication — they are **not**
gated by company role. Each reflects the requesting user's own single
effective plan (paid subscription, or Bronze fallback), independent of any
company membership. There is no company-scoped subscription concept.

## Admin/system separation

Company owner/admin roles never grant Django admin, wallet mutation
(personal or company), `TokenBillingPolicy` edits, subscription plan
activation/renewal/cancellation (admin-only via Django admin or the
`activate_subscription` management command), payment fulfillment, or
cross-company access.
