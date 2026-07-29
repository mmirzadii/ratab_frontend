# Permissions — backend-enforced matrix

Backend version: `v1.0` cumulative. UI may hide actions; **security is enforced
by the backend**.

Roles: `owner` > `admin` > `employee`.

## Role-scoped configurable catalogs

Source of truth: backend `apps/companies/permissions_catalog.py`.

### Employee configurable keys (defaults)

| Key | Default | Label (FA) |
| --- | :---: | --- |
| `can_invite_employees` | true | افزودن کارمند جدید |
| `can_create_projects` | true | ایجاد پروژه |
| `can_update_projects` | true | ویرایش پروژه |
| `can_create_custom_groups` | true | ایجاد گروه سفارشی |
| `can_create_financial_documents` | true | ایجاد سند مالی |
| `can_edit_unlocked_financial_documents` | true | ویرایش سند مالی قفل‌نشده |
| `can_upload_private_files` | true | آپلود فایل خصوصی |
| `can_attach_private_files` | true | پیوست فایل خصوصی |
| `can_attach_financial_documents` | true | پیوست سند مالی |

### Admin configurable keys (defaults)

Admin **inherits all Employee capabilities automatically**. Only Admin-specific
keys are configurable:

| Key | Default | Label (FA) |
| --- | :---: | --- |
| `can_add_admins` | **false** | افزودن مدیر جدید |
| `can_manage_company_profile` | true | مدیریت اطلاعات عملیاتی شرکت |
| `can_manage_invitations` | true | مدیریت دعوت‌نامه‌ها |
| `can_deactivate_employees` | true | غیرفعال‌سازی یا حذف کارمند |
| `can_manage_all_custom_groups` | true | مدیریت همه گروه‌های سفارشی |

### Owner

No configurable switches. Authority is implicit and complete.

## Settings payload fields

- `permission_settings` — stored/configurable switches (PATCH preferred field)
- `permissions` — effective permissions (may include inherited Employee keys for Admin)
- `configurable_permissions` / `permission_catalog` — Switch rows (`key`, `label_fa`, `type`, `default`, `value`)
- `can_edit_member`, `can_change_role`, `assignable_roles`, `edit_denied_reason`

Endpoints:

- `GET /api/company-members/{id}/settings/`
- `PATCH /api/company-members/{id}/settings/` with `role` and/or `permission_settings`

## Actor → target matrix

| Actor | Owner | Admin | Employee |
| --- | :---: | :---: | :---: |
| Owner | read-only / transfer | edit admin switches | edit employee switches |
| Admin | no | no | yes; promote only if `can_add_admins` |
| Employee | no | no | no |
