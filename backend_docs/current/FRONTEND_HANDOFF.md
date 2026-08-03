# Frontend handoff — current cumulative backend

Use this guide with `OPENAPI.yaml`. Backend version: `BACKEND_VERSION` = `v1.0`
(cumulative: preserved v0 financial/pricebook APIs + v1 auth/workspace/messaging/
files/wallet/quota/payments-disabled).

## Base URL expectations

- Local Docker API is commonly published on host port **15000** → container 8000
  (see `docker-compose.local.yml`). Confirm the URL for your environment.
- Dev/prod base URLs are deployment-owned. Do not hardcode secrets or private
  hostnames from docs into production builds.
- `GET /api/` has no index route (404 is expected). Use explicit paths.

## Environment assumptions

| Environment | Auth | Notes |
| --- | --- | --- |
| Local | Session + CSRF; local any-code signup may be enabled | `credentials: include` |
| Dev | Session + CSRF; local any-code forbidden | Configure CORS/CSRF trusted origins |
| Production | Session + CSRF; Secure cookies; docs off by default | Same-site / HTTPS required |

## Application startup

1. `GET /api/auth/csrf/`
2. `GET /api/auth/me/` with credentials
3. If 401 → unauthenticated routes (login/signup)
4. If 200 → restore session UI (companies, wallet, quota)

## Signup / login / logout

See `AUTH_AND_CSRF.md` for the exact contract.

Local verification accepts any non-empty numeric code **only** in local debug
mode — keep the verification UI anyway.

Password: backend requires **at least 6 characters**. Stronger strength checks
are optional frontend warnings only and must not block signup. See
`AUTH_AND_CSRF.md`.

## Authenticated routing

- Unauthenticated users: auth screens only.
- Authenticated users: workspace selection, then company-scoped screens.
- On 401 from an API call: clear UI session and return to login.
- Logout: `POST /api/auth/logout/` with CSRF → expect 204.

## Companies, roles, groups

- Create/list companies; switch active company in the UI.
- Roles: `owner` > `admin` > `employee` — see `PERMISSIONS.md`. Exactly one
  active owner per company. Ownership changes only via
  `POST /api/companies/{id}/transfer-ownership/` (previous owner becomes
  `admin`). Ordinary invite/role APIs cannot assign `owner`.
- Member payloads include `permission_settings` (role-stored only),
  `inherited_permissions`, `effective_permissions` / `permissions`,
  `configurable_permissions` / `permission_catalog` (with `label_fa` + current
  `value`), `can_edit_member`, `can_change_role`, `assignable_roles`, and
  `edit_denied_reason`. Admin inherits all Employee capabilities; Admin
  configurable catalog is Admin-only (no duplicate Employee switches). See
  `PERMISSIONS.md` for the full catalogs and defaults.
- Use `GET|PATCH /api/company-members/{id}/settings/`. PATCH body prefers
  `permission_settings`; `permissions` remains an accepted alias.
- Only the owner may edit an Admin target. Admins may edit Employees only;
  `can_add_admins` allows promotion/invite of a new admin, not editing existing
  admins.
- Hide management controls for employees, but still handle 403/400 from the API.
- The workspace is **chat-first**: everyday UX is group conversations. Project and
  group APIs remain for creation, permissions, financial documents, and
  compatibility — do not build separate everyday Projects/Groups sections.
- Company create atomically creates exactly one system public group with
  `group_type: "public"`, display name `عمومی`, and `pin_priority: 0`. Response
  includes `public_group_id`. Pin public groups first using `group_type` /
  `pin_priority` (do not infer from name alone). Then order remaining groups by
  backend `last_activity_at` (latest successful message timestamp, else group
  `created_at`) — do not derive order by scanning each group's messages on the
  client. Public groups cannot be renamed, deleted, duplicated, or retyped.
  Hard delete of the public group returns `PUBLIC_GROUP_DELETE_FORBIDDEN`.
- Group list/detail include authoritative settings fields: `group_kind`
  (`public` | `project` | `custom`), `is_public`, `project_id`, nested
  `project` metadata (full editable project fields when linked), `can_edit`,
  `can_delete`, `deletion_type`, and `deletion_preview_available`. Do not infer
  project ownership from Persian titles or badges.
- Every active company member belongs to the public group. Accepting a company
  invitation auto-joins it; deactivating membership revokes group access.
- Company invitations are separate from custom-group invitations. A user with
  only a pending company invitation is not an active member and must not appear
  in the custom-group member picker (`GET /api/companies/{id}/members/?active_only=true&q=...`).
- Adding a registered user who is **not** an active company member creates a
  **pending invitation** (not an active membership). Pending users cannot enter
  the company or read/send group messages.
- Invitees list pending invites via `GET /api/company-invitations/` (paginated
  `{count, next, previous, results}`), then accept/reject. Compatibility aliases:
  `/api/auth/me/invitations/`, `/api/me/invitations/`,
  `/api/membership-invitations/`. Acceptance activates company + target-group
  membership and syncs public / auto-join project groups.
- Existing active company members can still be added directly to a group after
  create via `POST /api/company-groups/{id}/members/` (no redundant company
  invitation). Already-in-group returns idempotent success.
- Custom/normal groups: `POST /api/companies/{id}/groups/` accepts only `name`,
  optional `description`, and optional `member_ids` (active company members).
  The creator becomes an active member immediately; selected members receive
  **pending group invitations** and cannot read/send messages until they accept.
  Response includes `group`, `creator_membership`, `pending_invitation_count`,
  and `invitations`. Public/project types cannot be created here.
- Last active owner cannot be demoted/removed — show a clear error from 409/400.

## Projects and project groups

- `POST /api/companies/{company_id}/projects/` atomically creates the project
  **and** exactly one linked group with `group_type: "project"`.
- Group list/detail expose `project_id` and a nested `project` object with
  editable metadata — do not infer the project from the group name.
- Response includes read-only `group_id` plus
  `include_all_company_members_in_group` (default **`true`** when omitted).
- When `true`: all current active company members join; future accepted members
  auto-join. When `false`: only the creator; later adds use group-member APIs.
- **Project-group settings:** `PATCH /api/company-groups/{id}/` with project
  fields (name, description, codes, parties, dates, status,
  `include_all_company_members_in_group`) updates the linked Project via
  `can_update_projects`. Renaming the project updates the project-group display
  name in the same transaction. Ordinary custom groups still edit only group
  `name` / `description`.
- Soft archive remains available as `POST .../deactivate/` for custom groups
  only (public/project groups stay protected).

## Group / project hard deletion

Before destructive delete, call the non-destructive preview:

- `GET /api/company-groups/{id}/deletion-preview/`
- `GET /api/projects/{id}/deletion-preview/`

Preview returns counts only (no message content), `deletion_type`
(`group` | `project`), `confirmation_required`, `warning_key`, and
`warning_message_fa`.

Destructive confirmation (backend-enforced; the modal is not a security
boundary):

- Ordinary custom group: `DELETE /api/company-groups/{id}/` with
  `{"confirmation":"DELETE_GROUP"}` — requires `can_delete_custom_groups` plus
  group-manage authority. Removes that group, memberships, messages, and
  message attachments. Does **not** delete the company, other groups/projects,
  or shared storage files still referenced elsewhere.
- Project group or project: `DELETE /api/company-groups/{id}/` or
  `DELETE /api/projects/{id}/` with `{"confirmation":"DELETE_PROJECT"}` —
  requires `can_delete_projects`. Deletes the project, linked project group,
  project messages, financial documents/lines/selected pricebooks, project
  coefficient sets, calculation sessions/receipts for those documents, and
  related project-owned records. Public group and unrelated company data remain.
- Public group delete is always rejected with `PUBLIC_GROUP_DELETE_FORBIDDEN`.
- Missing/wrong confirmation → `DELETION_CONFIRMATION_REQUIRED`.
- Unauthorized → `GROUP_DELETE_FORBIDDEN` / `PROJECT_DELETE_FORBIDDEN`.

## Financial documents in chat

There is **one** attachment flow: create a group message with
`attachment_type: "financial_document"` and `resource_id`.

- **Project-linked group:** list/create docs via
  `GET|POST /api/company-groups/{group_id}/financial-documents/` — the linked
  project is authoritative; sending another `project_id` is rejected. Attach
  only documents from that project.
- **Public/custom group:** do not infer a project. Pass explicit `project_id`
  (query on GET, body on POST) for the same company-group FD endpoints, or use
  `GET|POST /api/projects/{project_id}/financial-documents/`.
- Frontend may select an existing document or create one then attach it. Never
  duplicate document content/snapshots merely to attach.

## Shared resources in a conversation

Active group members only (`page` size 50):

- `GET /api/company-groups/{id}/shared-resources/financial-documents/`
- `GET /api/company-groups/{id}/shared-resources/files/`
- `GET /api/company-groups/{id}/shared-resources/links/`

Items include resource identity, title/filename, sender, message id, shared
timestamp, and authorized `open_path` / `download_path` (files). Links are
HTTP/HTTPS URLs extracted from message text only — never fetched server-side;
other schemes are ignored. No permanent public storage URLs.

## Messages, files, attachments

- Messages list/create: `GET|POST /api/company-groups/{group_id}/messages/`
  (page size 50).
- Message lifecycle: `PATCH|DELETE /api/group-messages/{message_id}/`,
  `POST /api/group-messages/{message_id}/forward/`.
- Create payload: optional `text` and/or
  `attachments: [{attachment_type, resource_id}]`, optional
  `client_message_id` for idempotent retries.
- A successful create/forward response includes the persisted message `id` and
  server `created_at`. Treat that as **server-confirmed sent**, not a read
  receipt. Exact retries with the same `client_message_id` and payload return
  the same message; a reused key with a different payload returns
  `IDEMPOTENCY_KEY_REUSED` (409).
- Edit changes only text/caption, preserves attachments, records `edited_at` /
  `is_edited`, consumes **no** quota, and does **not** reorder the group.
- Soft delete returns a tombstone (`text` = `پیام حذف شد`, empty
  `attachments`, `is_deleted=true`). Original content is hidden from normal
  responses. Delete consumes **no** quota and does **not** reorder the group.
- Forward creates one new message in an eligible **same-company** group —
  including the **source group** itself. Same-group forward is a new message
  (new `id` / `created_at`), not a rewrite of the original. It consumes one
  normal message quota slot, stores an immutable `forwarded_from` snapshot,
  and copies attachment references after target-context validation.
- Capability fields on every message response (do **not** reconstruct from
  roles): `can_edit`, `can_delete`, `can_forward`.
- Types: `file` | `financial_document` only. **`project` attachments cannot be
  created** (validation / `project_attachment_disabled`). Historical rows, if
  any, stay readable for compatibility but must not be offered as a new attach
  option in the UI.
- Upload files first via `POST /api/companies/{company_id}/files/` (multipart
  `file`, optional `checksum_sha256`).
- Open/download only through authorized endpoints; never expect public URLs.
  Attachments belonging to soft-deleted messages are not openable through the
  normal attachment API.
- Quota: on 429 `MESSAGE_QUOTA_EXCEEDED`, disable send/forward and show
  `resets_at`. Edit/delete are never blocked by quota.

## Pricebooks and calculations

### Family and year selection (Phase 11)

- A **Pricebook** is a family/type. Authoritative machine `code` has **no year**
  (example: `building`). Short UI label is `title_fa` (e.g. `ابنیه`); longer
  official Persian title is `official_title_fa`. Do **not** treat `ABN1404` as
  the family identity — it is a legacy alias only.
- An **edition** is one family + one year. Client UX: pick one or more
  family/year pairs; submit resolved edition id(s) on create.
- Preferred create body: `pricebook_edition_ids: […]` — the server resolves
  each edition’s active official PriceSet. Legacy singular
  `pricebook_edition_id` + `price_set_id` still works and creates one selection.
- Document responses include authoritative `selected_pricebooks` (selection id,
  family code/title, edition id, year, price set id/code, active/stale flags)
  plus legacy singular `pricebook_edition_id` / `price_set_id` mirroring the
  **primary** (first) selection only.
- `GET /api/pricebooks/` — active families (`code`, `title_fa`,
  `official_title_fa`, `base_year`, `sort_order`, `is_active`,
  `latest_available_year`). Do not embed year in the family dropdown label.
- `GET /api/pricebooks/{id}/editions/` — editions usable for **new** documents:
  `is_active` and not `is_stale`, newest `year` first. Fields include
  `family_code`, `family_title_fa`, `year`, `is_active`, `is_stale`,
  `is_base_year`, `active_price_set` (official set code `official-<year>`).
- Default year for a family: `latest_available_year` (newest active non-stale).
- Existing documents keep their saved selections even if an edition later
  becomes inactive or stale; retrieve by edition id still works for browse.
- A FinancialDocument has **one or more** immutable selected Edition/PriceSet
  bindings while locked/finalized. While draft: add via
  `POST .../document-pricebooks/`, remove unused via
  `DELETE .../document-pricebooks/{selection_id}/` (blocked if lines reference
  it or it is the last selection).
- Create/add reject inactive or stale editions (field error on
  `pricebook_edition_id` / `pricebook_edition_ids`). For the multi-id path the
  server resolves the official PriceSet; for legacy singular create the client
  still sends `price_set_id` belonging to the edition.

### Browse and calculate

- Browse editions → chapters → groups → items.
- Row codes are **strings** (preserve leading zeros).
- Opening an official pricebook item modal is free. Call
  `POST /api/financial-documents/{id}/official-calculation-sessions/` with
  `pricebook_item_id` to obtain a server-issued `calculation_session_id`.
  That call does not calculate, debit tokens, or create a line.
- `POST /api/pricebook-items/{id}/calculate/` and
  `POST /api/financial-documents/{id}/official-calculations/` require
  `calculation_session_id` plus `idempotency_key` (and
  `financial_document_id` on the pricebook endpoint). They run the existing
  automatic authoritative calculation for the current inputs.
- **Billing rule (official only):** the first successful calculation in an
  open modal session costs the configured official price (default **2**
  tokens). Later successful recalculations in that same open session are
  free and refresh the current receipt. Closing/reopening the modal opens a
  new session whose first success may charge again. Do not trust a client
  `already_paid` flag.
- Responses use `CalculationBillingResultSerializer` (`result`, `receipt`,
  `billing`, `personal_balance`, `company_balance`, `replayed`,
  `calculation_session_id`). Debit order is personal wallet first, then the
  document's company wallet.
- Invalid/incomplete inputs remain free (structured 400). Starred
  calculations are unchanged (still billed per successful starred request;
  no modal session).
- Backend calculation is authoritative; do not trust client math as truth.

## Calculation billing (official + starred)

Line creation is not the charge event. Official charging happens on the
**first successful calculation in a modal session**; creating the line from
the latest receipt is free.

1. `POST /api/financial-documents/{id}/official-calculation-sessions/` with
   `pricebook_item_id` — free; returns `calculation_session_id`.
2. `POST /api/financial-documents/{id}/official-calculations/` (or
   `POST /api/pricebook-items/{id}/calculate/`) with
   `calculation_session_id` + `idempotency_key` + inputs — first success in
   the session debits tokens; later successes in the same session cost **0**.
3. `POST /api/financial-documents/{id}/lines/` with `calculation_receipt_id`
   (the **latest** receipt for that session) — creates the line. **Free**.
   Stale (superseded) receipts are rejected.
4. **Add-without-receipt fallback:** `POST .../lines/` with
   `pricebook_item_id` + inputs + `idempotency_key` opens a session internally
   if needed, bills at most once for that session, then creates the line.
5. Starred: `POST .../starred-calculations/` remains per-calculation billing
   (default 1 token); no official modal-session rule.

Costs (admin-configurable via `TokenBillingPolicy`, defaults shown):

| Calculation type | Default cost | Notes |
| --- | :---: | --- |
| Official pricebook calculation (first success per modal session) | **2** tokens | `official_calculation_cost` |
| Starred standalone calculation | **1** token | `starred_calculation_cost` |
| New account signup grant | **12** tokens | `new_account_initial_grant`, granted once |

- Costs are admin-managed and may change; always read the live values from
  `GET /api/token-wallet/` (`official_calculation_cost`,
  `starred_calculation_cost`) or `GET /api/companies/{id}/token-wallet/` rather
  than hardcoding `2`/`1`/`12`.
- Debiting order is always **personal wallet first, then company wallet** for
  any remainder — never the reverse. Company is derived from the financial
  document; never trust a client-chosen spending company.
- A receipt is single-use for line linking: replaying the exact same
  `idempotency_key` + payload for a calculation returns the original receipt
  (HTTP 200, `replayed: true`) without charging again; replaying the exact
  same line create for a `calculation_receipt_id` (or the same Add-without-
  receipt key/payload) that already produced a line returns the original line
  (HTTP 200) without creating a second line.
- Edit/delete/recalculate/preview/export never charge tokens.
- Insufficient combined balance on the first unpaid success attempt returns
  HTTP **402** `INSUFFICIENT_COMBINED_TOKEN_BALANCE` with
  `calculation_session_id` and no result, receipt, debit, or line. The unpaid
  session remains usable after the user obtains tokens.

## Company token wallet and donations

Each company has its own token wallet, separate from personal wallets, used
only as a fallback source for calculation charges once a member's personal
wallet is exhausted.

- `GET /api/companies/{id}/token-wallet/` — balance, current
  `official_calculation_cost` / `starred_calculation_cost`, and
  `fallback_available` (true when balance > 0). Any active internal member can
  read this.
- `GET /api/companies/{id}/token-donations/` — paginated donation history,
  visible to all active internal members.
- `POST /api/companies/{id}/token-donations/` — any active internal member can
  donate tokens from their own personal wallet into the company wallet.
  Body: `{"amount": "10", "idempotency_key": "optional-retry-key"}`. Donations
  move tokens **out of the donor's personal balance immediately**; there is no
  reverse company→user withdrawal endpoint.

## Financial documents

- Create/list under a project; edit lines while unlocked.
- On create, prefer `pricebook_edition_ids` from family/year pickers (server
  resolves official price sets). Legacy `pricebook_edition_id` + `price_set_id`
  remains supported for single-pricebook clients.
- Read `selected_pricebooks` as the authoritative list; singular edition/set
  fields are the primary selection only.
- When the document has **more than one** selection, pricebook line creates
  (receipt or Add-without-receipt) **must** send `document_pricebook_id`.
  With exactly one selection, the backend may infer it.
- Official pricebook-backed lines are created from a paid calculation receipt
  (`calculation_receipt_id`) **or** via the Add-without-receipt fallback that
  bills one official calculation then creates the line. Receipt-backed create
  itself is **free**.
- Standalone starred/custom lines without a pricebook item and without a
  receipt do **not** charge and may omit `document_pricebook_id`.
- Edit/delete/recalculate/preview/export do **not** charge.
- Always send a client `idempotency_key` for calculation and line-create calls
  that may be retried.
- Locked documents: disable edits and document-pricebook add/remove; handle
  backend conflict responses.
- Export may be blocked while PDF rendering is unavailable (409).

## Wallet

- `GET /api/token-wallet/` and `/transactions/` — current user's personal
  wallet only. Response includes `balance` plus the live
  `official_calculation_cost` / `starred_calculation_cost`.
- New accounts receive `new_account_initial_grant` tokens (default **12**)
  once, at signup.
- Refresh both the personal wallet and the company wallet (if shown) after a
  successful calculation.
- On 402 `INSUFFICIENT_COMBINED_TOKEN_BALANCE` (calculation endpoints), show
  `required_tokens`, `personal_balance`, `company_balance`, and
  `total_available`; suggest a company donation or admin top-up.
- On 402 `INSUFFICIENT_PERSONAL_TOKEN_BALANCE` (donations), show required vs
  available personal tokens. Donations never spend the company wallet.
- Personal and company balances are separate: global header = personal only;
  company context header = company only (`GET /api/companies/{id}/token-wallet/`).
- Never send cost, balance, grant, or payment status as client authorities.

## Subscriptions and quota

**Invariant: every user has exactly one effective plan at all times.** If a
valid paid `UserSubscription` exists, that plan is effective; otherwise
**Bronze is the free fallback** — no `UserSubscription` row is required or
created for it. There is never a state with zero or multiple effective plans.

- `GET /api/subscription-plans/` — catalog rows (currently **bronze**,
  **silver**, **gold**), each with explicit flags. Do not confuse these:
  - `is_available` — catalog availability (`SubscriptionPlan.is_active`).
    Gold is listed with `is_available: false`; it is never purchasable or
    effective.
  - `is_current` — this row is the user's single effective plan right now.
    Exactly one row has `is_current: true`.
  - `is_free_fallback` — marks Bronze, the plan used whenever there is no
    valid paid subscription.
  - `can_activate` — true only for a paid, available plan that is not
    already current (false for Bronze and for gold while unavailable).
- `GET /api/subscription/` — the authenticated user's single effective plan:
  `effective_plan_code`, `effective_plan_title_fa`,
  `effective_daily_message_limit`, `effective_max_attachment_bytes`,
  `is_free_fallback`, `has_paid_subscription` (= `has_active_subscription`),
  `status` (`"active"` for a paid subscription, `"free_fallback"` for
  Bronze), plus `starts_at`/`ends_at` (both `null` while on Bronze).
- `GET /api/message-quota/` always resolves against the same effective plan
  (Bronze when there is no paid subscription) — `plan_code` in the quota
  response is never `null` in practice while Bronze exists.
- Current catalog values (admin-configurable; always read live, do not
  hardcode): **Bronze** — 20 daily messages, 10 MiB max attachment, free,
  always the fallback (`can_activate: false`). **Silver** — 500 daily
  messages, 50 MiB max attachment, paid; `can_activate: true` when not
  already current, but there is **no public purchase/activate API** in
  v1.0 (online payment is disabled) — activation is admin-only today, via
  Django admin or the `activate_subscription` management command. **Gold**
  — currently `is_available: false`; do not offer it for activation.
- Null `effective_daily_message_limit` means unlimited for that plan (usage
  may still be recorded); this does not currently apply to any active
  catalog plan.
- Display limits from the API; do not invent production plan codes,
  free-tier numbers, or assume Bronze values from this doc without checking
  the live response — they are admin-configurable.

## Disabled payments and local demo purchase

- `POST /api/payments/orders/` with only `package_code` (+ optional
  `idempotency_key`) returns 503 `PAYMENTS_DISABLED`. Real online payment
  stays disabled until a verified provider exists.
- Local/Development instant Buy uses `POST /api/payments/demo-purchase/` with
  **only** `{package_code, idempotency_key}`. Prices and token amounts come
  from the server. Response is `{order, wallet_balance}`. First success is
  **201**; exact replay is **200** + `Idempotent-Replayed: true`. Do **not**
  add tokens in the client.
- Read availability from `GET /api/token-wallet/` → `commerce`
  (`demo_purchase_available`, `purchasing_disabled`, `mode`) plus
  `token_packages`. Do not guess from the frontend environment alone.

## Pagination, loading, concurrency

- Page-number pagination: `?page=`, page size **50**, shape
  `{count, next, previous, results}`.
- Prefer idempotency keys for unsafe retries of charged creates.
- Concurrent last-slot message sends: expect one success and one 429.

## Errors

See `ERROR_CODES.md`. Prefer stable `code` fields when present.

## Backend vs presentation

| Rule | Enforced by |
| --- | --- |
| Auth, CSRF, membership, cross-company isolation | Backend |
| Password minimum length (6) | Backend |
| Extra password-strength warnings beyond length 6 | UI only (must not block signup) |
| Token charge, quota, payment disable | Backend |
| Hiding admin buttons for employees | UI only (still handle 403) |
| Confirming “this calculation costs N tokens” | UI only (backend enforces the live policy cost, currently 2/1) |

## Health (optional for apps)

- `/api/health/` and `/api/health/live/` — liveness
- `/api/health/ready/` — 200 ready / 503 degraded with check map

## Platform admin (Phase 12 — Passkey / WebAuthn)

Platform admin is **not** a company role. Company Owner/Admin/Employee never
unlock these APIs. Ordinary users do not need Passkeys.

1. Drive Admin shell routing from `GET /api/platform-admin/security/status/` (`next_step`).
2. `GET /api/platform-admin/me/` returns identity/capabilities when authorized and embeds `security`.
3. Entry: normal login → Passkey assertion (`/session/webauthn/`) → short-lived Admin session.
4. Initial enrollment: account-password reauth → `/passkeys/registration/options|verify/`.
5. Root needs **two** Passkeys; delegated Admins need **one**.
6. Critical mutations: CSRF + recent Passkey step-up (`/step-up/webauthn/`) + reason.
7. Legacy password step-up / TOTP / action-proof routes are retired (HTTP 410).
8. Admin-management UI is root-Superuser-only. Ticket reply remains a baseline capability.
9. User tickets: `/api/support/tickets/` (own tickets only; internal notes never appear).
