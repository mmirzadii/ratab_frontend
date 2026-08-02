# Support Ticketing Specification

## اصل مصوب

هر Admin فعال، بدون نیاز به capability اضافه، می‌تواند همه تیکت‌ها را ببیند و پاسخ عمومی بدهد.

Baseline:

```text
admin.tickets.view
admin.tickets.reply
```

## مدل‌ها

### SupportTicket

- public_id خوانا
- created_by_user
- company اختیاری
- subject
- category
- priority
- status
- assigned_to_admin اختیاری
- last_user_message_at
- last_admin_message_at
- resolved_at
- closed_at
- timestamps

Status:

```text
open
waiting_for_staff
waiting_for_user
resolved
closed
```

Category:

```text
account
billing
payment
subscription
pricebook
financial_document
company
technical
other
```

### SupportTicketMessage

- ticket
- author_user
- author_admin_membership nullable
- kind: `user_message`, `admin_reply`, `internal_note`, `system_event`
- body
- created_at
- immutable by default

### SupportTicketAttachment

- message
- PrivateFile abstraction
- metadata snapshot

### SupportTicketEvent

Append-only:

- created
- assigned
- priority_changed
- status_changed
- replied
- internal_note_added
- closed
- reopened

## رفتار کاربر

- create/list/detail own tickets
- reply to allowed status
- see public admin replies
- close/reopen طبق policy
- never see internal notes

## رفتار همه Adminها

هر Admin فعال:

- list/filter/search tickets
- detail/timeline public data
- send public reply
- download authorized attachments

پاسخ عمومی Admin:

- status را به `waiting_for_user` تغییر می‌دهد مگر service policy خلاف آن باشد
- actor Admin را ثبت می‌کند
- audit/event ایجاد می‌کند

## رفتار capability-based پیشرفته

- `admin.tickets.internal_note`: یادداشت داخلی
- `admin.tickets.assign`: assign/unassign
- `admin.tickets.manage_priority`: تغییر priority
- `admin.tickets.manage_status`: resolve/close/reopen

## امنیت

- user object access بر اساس creator
- Admin access فقط active membership/root
- internal note serializer/query جدا
- no HTML execution
- rate limits
- private files
- no raw URL
- audit برای staff actions

## UX کاربر

```text
/settings?tab=support
/support/tickets
/support/tickets/:ticketId
```

## UX Admin

```text
/admin/support/tickets
/admin/support/tickets/:ticketId
```

Admin shell باید بخش پشتیبانی را برای همه Adminهای فعال نمایش دهد، حتی اگر هیچ capability اختیاری دیگری ندارند.
