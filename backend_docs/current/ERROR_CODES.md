# Stable frontend-relevant errors

Only codes and outcomes the current backend actually returns. Do not invent
codes. Field names match APIException JSON bodies unless noted.

## Catalog

### Authentication required

| | |
| --- | --- |
| Code / shape | Usually `{"detail":"…"}` (DRF); no stable business `code` |
| HTTP | 401 |
| Operations | Any authenticated endpoint without a valid session (or legacy token) |
| Meaning | Not authenticated |
| Frontend | Route to login; clear local auth UI state |
| Retry | Safe after login |
| Action required | User login |

### Invalid credentials

| | |
| --- | --- |
| Code | DRF `invalid_credentials` metadata; body typically `{"detail":"…"}` |
| HTTP | 401 |
| Operations | `POST /api/auth/login/` |
| Meaning | Unknown phone or wrong password (generic) |
| Frontend | Show generic failure; do not reveal which field was wrong |
| Retry | Safe with corrected credentials |
| Action required | User |

### CSRF failure

| | |
| --- | --- |
| Code / shape | Django/DRF 403 detail |
| HTTP | 403 |
| Operations | State-changing session requests missing/invalid `X-CSRFToken` |
| Meaning | CSRF check failed |
| Frontend | `GET /api/auth/csrf/`, then retry once |
| Retry | Safe once after CSRF refresh |
| Action required | Client retry |

### Permission denied / cross-company

| | |
| --- | --- |
| Code / shape | `{"detail":"…"}` |
| HTTP | 403 |
| Operations | Company, group, message, file, document access |
| Meaning | Authenticated but not allowed |
| Frontend | Show access denied; do not retry with guessed IDs |
| Retry | Not safe as-is |
| Action required | Different account or membership |

### Resource not found / unavailable

| | |
| --- | --- |
| Code / shape | `{"detail":"…"}` |
| HTTP | 404 |
| Operations | Missing IDs; pending/failed files; missing attachment targets; disabled `dev-login` |
| Meaning | Not found or not available |
| Frontend | Treat as missing resource |
| Retry | Not useful unless resource appears later |
| Action required | User navigation |

### Validation error

| | |
| --- | --- |
| Code / shape | Field-keyed DRF errors, e.g. `{"phone_number":["…"]}` |
| HTTP | 400 |
| Operations | Most POST/PATCH bodies |
| Meaning | Invalid input |
| Frontend | Map field errors into forms |
| Retry | Safe after correcting input |
| Action required | User |

### Signup password too short

| | |
| --- | --- |
| Code / shape | `{"password":["…"]}` (Django min-length message; JSON, not HTML) |
| HTTP | 400 |
| Operations | `POST /api/auth/signup/complete/` |
| Meaning | Password shorter than the backend minimum of **6** characters |
| Frontend | Show on the password field; do **not** treat as invalid signup ticket |
| Retry | Safe with a password of length ≥ 6; ticket remains usable until expiry/use |
| Action required | User |

### Signup ticket invalid / expired / used

| | |
| --- | --- |
| Code / shape | DRF validation detail for `invalid_signup_ticket` (not a field `password` error) |
| HTTP | 400 |
| Operations | `POST /api/auth/signup/complete/` with missing/expired/used ticket |
| Meaning | One-time signup ticket cannot be consumed |
| Frontend | Restart signup from start; do not confuse with password validation |
| Retry | Not with the same ticket |
| Action required | User restarts signup |

### Invitation not pending

| | |
| --- | --- |
| Code / shape | `{"detail":"…"}` with code `invitation_not_pending` when applicable |
| HTTP | 400 |
| Operations | Accept / reject / cancel invitation |
| Meaning | Invitation is not in `pending` status |
| Frontend | Refresh invitation list; do not retry the same transition |
| Retry | Not useful for the same invitation state |
| Action required | User |

### Public group protected

| | |
| --- | --- |
| Code | `public_group_protected` (or field `name` with `public_group_name_reserved`) |
| HTTP | 400 |
| Operations | Update / deactivate public `عمومی` group; create another group named `عمومی` |
| Meaning | System public group cannot be mutated, deactivated, or duplicated by name |
| Frontend | Hide those controls for the public group; show a clear non-retryable error |
| Retry | Not useful |
| Action required | Use a different custom group name / action |

### Invalid custom-group member selection

| | |
| --- | --- |
| Shape | `{"member_ids": ["…"]}` field errors (complete rejection) |
| HTTP | 400 |
| Operations | `POST /api/companies/{id}/groups/` with `member_ids` |
| Meaning | A selected ID is missing, inactive, pending-only, or belongs to another company. No group or invitations are created. |
| Frontend | Highlight invalid selections; do not treat as partial success |
| Retry | After correcting the selection |
| Action required | User |

### Owner not editable / owner role assignment forbidden

| | |
| --- | --- |
| Codes | `owner_not_editable`, `owner_role_assignment_forbidden` |
| HTTP | 400 |
| Operations | Ordinary member role/settings/invite/deactivate/remove; invitations with `role=owner` |
| Meaning | Owner cannot be edited normally; owner role is not assignable except via transfer |
| Frontend | Hide owner edit controls; use transfer-ownership for handoff; trust `edit_denied_reason` |
| Retry | Not useful for the same request |
| Action required | Owner uses transfer, or manage a non-owner member |

### Admin cannot manage admin / member management forbidden

| | |
| --- | --- |
| Codes | `admin_cannot_manage_admin`, `member_management_forbidden` |
| HTTP | 400 |
| Operations | `PATCH /api/company-members/{id}/settings/` or `/role/`, deactivate, remove |
| Meaning | Admin cannot edit another admin (including self via settings); employee cannot manage members |
| Frontend | Use `can_edit_member` / `edit_denied_reason`; do not offer admin→admin settings UI |
| Retry | Not useful for the same actor/target pair |
| Action required | Owner manages admins; employees only invite when allowed |

### Admin promotion forbidden

| | |
| --- | --- |
| Code | `admin_promotion_forbidden` |
| HTTP | 400 |
| Operations | Invite/promote with `role=admin` while actor `can_add_admins=false` |
| Meaning | Admin may manage employees but cannot add/promote admins without the switch |
| Frontend | Hide promote-to-admin when `assignable_roles` lacks `admin` |
| Retry | Safe after owner enables `can_add_admins` |
| Action required | Owner enables `can_add_admins`, or owner performs the promotion |

### Ownership transfer invalid target

| | |
| --- | --- |
| Codes | `ownership_transfer_invalid_target`, `ownership_transfer_inactive_target`, `ownership_transfer_same_member` |
| HTTP | 400 |
| Operations | `POST /api/companies/{id}/transfer-ownership/` |
| Meaning | Target is missing, inactive, not in company, or already the owner |
| Frontend | Refresh members; only offer active non-owner members |
| Retry | Safe with a valid target |
| Action required | Client |

### Invalid permission key / owner permissions not configurable

| | |
| --- | --- |
| Codes | `invalid_permission_key`, `invalid_permission_key_for_role`, `owner_permissions_not_configurable`, `invalid_permission_value` |
| HTTP | 400 |
| Operations | `PATCH /api/company-members/{id}/settings/` |
| Meaning | Permission switch is outside the role catalog, not a boolean, or owner switches were sent |
| Frontend | Only render `permission_catalog` for the member's role |
| Retry | Safe after correcting keys/values |
| Action required | Client |

### Project attachment disabled

| | |
| --- | --- |
| Code | `project_attachment_disabled` (field `attachment_type`) |
| HTTP | 400 |
| Operations | `POST /api/company-groups/{id}/messages/` with `attachment_type: "project"` |
| Meaning | New project message attachments are not allowed |
| Frontend | Only offer `file` and `financial_document`; do not send `project` |
| Retry | Safe after correcting attachment type |
| Action required | Client |

### Project override forbidden / project required

| | |
| --- | --- |
| Codes | `project_override_forbidden`, `project_required` (field `project_id`) |
| HTTP | 400 |
| Operations | `GET|POST /api/company-groups/{id}/financial-documents/` |
| Meaning | Project-linked groups reject another `project_id`; public/custom groups require an explicit one |
| Frontend | Omit `project_id` for project groups; always send it for public/custom |
| Retry | Safe after correcting project selection |
| Action required | Client |

### Financial document project scope

| | |
| --- | --- |
| Code | `financial_document_project_scope` (field `attachments`) |
| HTTP | 400 |
| Operations | Attach FD to a project-linked group message |
| Meaning | Document belongs to a different project than the group's linked project |
| Frontend | Refresh selectable docs from the group FD list |
| Retry | Safe with a document from the linked project |
| Action required | Client |

### Pricebook edition inactive or stale

| | |
| --- | --- |
| Shape | `{"pricebook_edition_id":["Pricebook edition is inactive or stale and cannot be used for new documents."]}` |
| HTTP | 400 |
| Operations | `POST` financial-document create (project or group endpoints) |
| Meaning | Selected edition is not usable for new documents (`is_active=false` or `is_stale=true`) |
| Frontend | Re-fetch `GET /api/pricebooks/{id}/editions/` (active + non-stale only); pick another year |
| Retry | Safe after selecting a usable edition |
| Action required | Client |

### Price set mismatch or inactive

| | |
| --- | --- |
| Shape | Field-keyed on `price_set_id` (must belong to the edition; must be active) |
| HTTP | 400 |
| Operations | Financial-document create |
| Meaning | Price set does not match the selected edition, or is inactive |
| Frontend | Use `active_price_set` from the editions list (`official-<year>`) |
| Retry | Safe after correcting `price_set_id` |
| Action required | Client |

### Membership conflict (protected remove)

| | |
| --- | --- |
| Code | `membership_conflict` |
| HTTP | 409 |
| Operations | `DELETE /api/company-members/{id}/` |
| Meaning | Member row is protected by historical references |
| Frontend | Prefer deactivate; show conflict message |
| Retry | Not until references are cleared |
| Action required | User / admin |

### File validation / storage failure

| | |
| --- | --- |
| Code | Validation 400; storage issues may be 503 with generic detail (`storage_unavailable`) |
| HTTP | 400 or 503 |
| Operations | Company file upload, open/download |
| Meaning | Rejected file metadata/size/type, or storage unavailable |
| Frontend | Show upload error; do not expose backend storage details |
| Retry | 400: after fix; 503: later |
| Action required | User / ops |

### Insufficient combined token balance

| | |
| --- | --- |
| Code | `INSUFFICIENT_COMBINED_TOKEN_BALANCE` |
| HTTP | 402 |
| Operations | `POST /api/financial-documents/{id}/official-calculations/`, `.../starred-calculations/`, `POST /api/pricebook-items/{id}/calculate/`, and Add-without-receipt `POST .../lines/` with `pricebook_item_id` |
| Fields | `code`, `detail`, `required_tokens`, `personal_balance`, `company_balance`, `total_available`, `calculation_type`, `official_calculation_cost` (official) or `starred_calculation_cost` (starred), `company_id` when safe, and `calculation_session_id` for official modal-session attempts (token amounts as strings) |
| Meaning | Neither the caller's personal wallet nor the document's company wallet has enough combined balance for the calculation's admin-configured cost. No authoritative result, receipt, debit, or line is created. For official items the unpaid modal session remains open for retry after tokens are obtained. |
| Frontend | Block the calculation; show required vs. `personal_balance` + `company_balance`; offer a company donation or admin top-up |
| Retry | Safe once either wallet's balance increases |
| Action required | Member donation (`POST /api/companies/{id}/token-donations/`) or admin grant |

### Insufficient personal token balance

| | |
| --- | --- |
| Code | `INSUFFICIENT_PERSONAL_TOKEN_BALANCE` |
| HTTP | 402 |
| Operations | `POST /api/companies/{id}/token-donations/` (donation amount exceeds the donor's personal balance) |
| Fields | `code`, `detail`, `required_tokens`, `available_tokens` (strings) |
| Meaning | The personal wallet lacks enough tokens for the donation (donations never draw from the company wallet) |
| Frontend | Block the donation; show required vs available |
| Retry | Safe after the personal balance increases |
| Action required | User earns/receives more personal tokens |

### Company membership required

| | |
| --- | --- |
| Code | `COMPANY_MEMBERSHIP_REQUIRED` |
| HTTP | 403 |
| Operations | `GET /api/companies/{id}/token-wallet/`, `GET|POST /api/companies/{id}/token-donations/` |
| Fields | `code`, `detail` |
| Meaning | Caller is not an active member of the target company |
| Frontend | Hide company wallet/donation UI; refresh memberships |
| Retry | After joining or reactivation |
| Action required | User / company admin |

### Invalid token amount

| | |
| --- | --- |
| Code | `INVALID_TOKEN_AMOUNT` |
| HTTP | 400 |
| Operations | `POST /api/companies/{id}/token-donations/` |
| Fields | `code`, `detail` |
| Meaning | Amount is not a positive whole number |
| Frontend | Show field validation |
| Retry | With a corrected amount |
| Action required | Client |

### Idempotency key reused for different request

| | |
| --- | --- |
| Code | `IDEMPOTENCY_KEY_REUSED` |
| HTTP | 409 |
| Operations | Official/starred calculation billing, receipt-backed line create, and company token donation, all keyed by `idempotency_key` |
| Meaning | Same key was used for a different payload |
| Frontend | Generate a new key; do not reuse |
| Retry | Only with a new key |
| Action required | Client |

### Exact idempotent replay (success)

| | |
| --- | --- |
| Outcome | HTTP **200** + `replayed: true` in the body (calculation endpoints), or `Idempotent-Replayed: true` response header (line create) |
| Operations | Exact same calculation request, receipt-backed line create, or donation + same `idempotency_key` |
| Meaning | Original receipt/line/donation returned; **no second charge or transfer** |
| Frontend | Treat as success; do not show a second debit |
| Retry | Already safe |

### Document locked / membership conflict / export not ready

| | |
| --- | --- |
| Codes | Often plain detail; membership may use `membership_conflict`; export `export_not_ready` |
| HTTP | 409 |
| Operations | Locked document mutations; protected member delete; PDF download while blocked |
| Meaning | Conflicting state |
| Frontend | Refresh resource; disable conflicting UI |
| Retry | Not until state changes |
| Action required | User / admin |

### Message quota exceeded

| | |
| --- | --- |
| Code | `MESSAGE_QUOTA_EXCEEDED` |
| HTTP | 429 |
| Operations | `POST /api/company-groups/{id}/messages/`, `POST /api/group-messages/{id}/forward/` |
| Fields | `code`, `detail`, `used_today`, `daily_limit`, `quota_date`, `resets_at` (counts as strings), `effective_plan_code` (the single effective plan checked, e.g. `bronze` when there is no paid subscription) |
| Meaning | Daily message limit reached for the user's current effective plan |
| Frontend | Disable send/forward; show reset time; optionally surface `effective_plan_code` to hint at upgrading |
| Retry | After `resets_at`, or immediately if a higher-limit plan becomes effective |
| Action required | Wait / admin subscription activation |

### Message edit forbidden

| | |
| --- | --- |
| Code | `MESSAGE_EDIT_FORBIDDEN` |
| HTTP | 403 |
| Operations | `PATCH /api/group-messages/{id}/` |
| Meaning | Caller is not the original sender (or cannot edit this message) |
| Frontend | Hide/disable edit; refresh message capabilities |

### Message delete forbidden

| | |
| --- | --- |
| Code | `MESSAGE_DELETE_FORBIDDEN` |
| HTTP | 403 |
| Operations | `DELETE /api/group-messages/{id}/` |
| Meaning | Caller lacks role/permission to soft-delete this message |
| Frontend | Hide/disable delete; refresh message capabilities |

### Message not editable

| | |
| --- | --- |
| Code | `MESSAGE_NOT_EDITABLE` |
| HTTP | 400 |
| Operations | `PATCH` / forward of deleted or system messages |
| Meaning | Soft-deleted or system messages cannot be edited/forwarded through ordinary APIs |
| Frontend | Show tombstone / disable lifecycle actions |

### Message forward target invalid

| | |
| --- | --- |
| Code | `MESSAGE_FORWARD_TARGET_INVALID` |
| HTTP | 400 |
| Operations | `POST /api/group-messages/{id}/forward/` |
| Meaning | Target group missing, inaccessible, or cross-company |
| Frontend | Re-select an eligible same-company group membership (the source group is allowed) |

### Message attachment forward denied

| | |
| --- | --- |
| Code | `MESSAGE_ATTACHMENT_FORWARD_DENIED` |
| HTTP | 400 |
| Operations | `POST /api/group-messages/{id}/forward/` |
| Meaning | At least one attachment cannot be safely referenced in the target context |
| Frontend | Abort forward; keep source message unchanged |

### Payments disabled

| | |
| --- | --- |
| Code | `PAYMENTS_DISABLED` |
| HTTP | 503 |
| Operations | `POST /api/payments/orders/` |
| Fields | `code`, `detail` |
| Meaning | Online payment is intentionally disabled |
| Frontend | Show “payments unavailable; contact admin for tokens/subscription” |
| Retry | Not until product enables payments |
| Action required | Admin manual grant/activation |

### Demo commerce disabled

| | |
| --- | --- |
| Code | `DEMO_COMMERCE_DISABLED` |
| HTTP | 403 |
| Operations | `POST /api/payments/demo-purchase/` |
| Fields | `code`, `detail` |
| Meaning | Instant demo purchase is not enabled on this server (Local/Development only; never production) |
| Frontend | Hide Buy or show “purchasing unavailable”; read `commerce` from `GET /api/token-wallet/` |
| Retry | Not until `DEMO_COMMERCE_ENABLED=true` on an approved Local/Dev server |
| Action required | Ops / local env config |

### Token package unavailable

| | |
| --- | --- |
| Code | `TOKEN_PACKAGE_UNAVAILABLE` |
| HTTP | 404 |
| Operations | `POST /api/payments/demo-purchase/` |
| Fields | `code`, `detail` |
| Meaning | Package code is missing or inactive |
| Frontend | Refresh package list from wallet; do not invent prices |
| Retry | With an active package code from the server |
| Action required | Client / admin package visibility |

### Readiness degraded

| | |
| --- | --- |
| Shape | `{status:"degraded", service:"ratab-backend", checks:{database,redis,storage}}` |
| HTTP | 503 |
| Operations | `GET /api/health/ready/` |
| Meaning | Dependency unavailable |
| Frontend | Optional ops banner; do not expose internals |
| Retry | Later |
| Action required | Ops |

## Notes

- Successful donation returns **201** with
  `{donation, personal_balance, company_balance}`; exact replay returns
  **200** with `Idempotent-Replayed: true`.
- Successful official/starred calculation billing returns **201** with the
  receipt; exact replay returns **200** with `replayed: true`.
- Successful receipt-backed line create returns **201**; exact replay returns
  **200** with `Idempotent-Replayed: true`. Neither step charges twice.
- Successful demo token purchase returns **201**; exact replay returns **200**
  with `Idempotent-Replayed: true`. Conflicting key reuse returns **409**
  `IDEMPOTENCY_KEY_REUSED`.
- Logout success is **204** with empty body.
- Never surface stack traces or storage credentials from error payloads.
