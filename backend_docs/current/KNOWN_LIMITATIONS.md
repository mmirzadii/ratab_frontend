# Known limitations — current backend

Documented limitations and unresolved owner decisions only. Do not treat
planned future work as implemented.

## Authentication and messaging delivery

- No real SMS/OTP provider is connected.
- Local signup verification may accept any non-empty numeric code only under
  local debug settings (`local_any_code`). Dev/production reject that mode.
- Existing accounts that never set a password need an administrator-set hashed
  password until an approved recovery flow exists.
- Backend password policy is intentionally minimal: **length ≥ 6 only**.
  Stronger checks are frontend warnings unless operators later approve a
  stricter backend policy. Do not invent a stricter production requirement in
  the current contract.
- Company/group invitations have no configured expiry; pending invitations
  remain valid until accepted, rejected, or cancelled.
- Custom-group create may invite already-active company members via pending
  invitations (no message access until accept). Post-create
  `POST /api/company-groups/{id}/members/` still adds existing members
  directly. Company invitations remain a separate flow for non-members.
- Single-check / server-confirmed sent status means the message row was
  persisted (`id` + `created_at`). It is **not** a read receipt, delivery
  receipt, or double-check. Read receipts, reactions, replies, voice
  messages, WebSockets, and local-only deletion are out of scope.
- Soft-deleted messages remain in the conversation as tombstones. Underlying
  private-file and financial-document records follow their existing retention
  rules; attachment cards are hidden from normal message responses.
- Forwarding is limited to one eligible same-company group per request.
  The source group itself is an allowed target and creates a new message.
  Cross-company forwarding is rejected to protect private files and financial
  documents.

## Billing and subscriptions

- Real online payment remains disabled. `POST /api/payments/orders/` returns
  `PAYMENTS_DISABLED`. No real bank/gateway is connected. `PAYMENTS_ENABLED`
  cannot be turned on safely in v1.0.
- Local/Development may enable instant demo package purchase via
  `DEMO_COMMERCE_ENABLED=true` and `POST /api/payments/demo-purchase/`.
  Production must keep demo commerce off and refuses to boot if it is enabled.
  Demo orders use provider mode `demo` and are **not** bank-verified.
- Frontend must never credit tokens locally; always trust wallet/ledger
  responses from the backend.
- Subscription plans **are** seeded: `bronze` (free fallback, 20 daily
  messages, 10 MiB attachment), `silver` (paid, 500 daily messages, 50 MiB
  attachment), and `gold` (seeded but `is_active=false` — listed in the
  catalog as unavailable, not currently purchasable or effective). Every user
  has exactly one effective plan at all times: a valid paid subscription, or
  Bronze as the free fallback with **no** `UserSubscription` row required.
  Treat these exact codes/limits as live-configurable — always read them from
  `GET /api/subscription-plans/` / `GET /api/subscription/` rather than
  hardcoding, since an operator may change them.
- Token packages (`tokens_5` / `tokens_20` / `tokens_50`) are server-managed
  and exposed on `GET /api/token-wallet/` together with commerce capability
  flags. Prices and token amounts are never client-controlled.
- There is no public purchase/activate API for paid subscription plans in
  v1.0 — activation is admin-only (Django admin or the
  `activate_subscription` management command), consistent with disabled
  online payments.
- `FREE_PLAN_DAILY_MESSAGE_LIMIT` is a legacy env-only fallback used **only**
  if the `bronze` catalog row is ever absent from the database; with Bronze
  seeded (the normal state), it is not read. Do not describe the product as
  having unlimited free messaging — Bronze's 20-message daily limit is the
  live free-tier behavior.
- Calculation-based token billing replaces the old fixed-line-charge model.
  Costs live in the admin-managed `TokenBillingPolicy` singleton (editable in
  Django admin with an audit trail), currently defaulting to **2** tokens for
  the first successful official calculation in an open modal session, **1**
  token for a starred calculation, and **12** tokens as the one-time
  new-account signup grant. Read the live values from
  `GET /api/token-wallet/` rather than hardcoding them; operators may change
  them at any time. Changing the grant affects **future** signups only —
  existing personal balances are never rewritten by deployment.
- Opening an official item modal (and
  `POST .../official-calculation-sessions/`) is free. Failed/incomplete
  validation is free. Later successful recalculations in the same open modal
  session are free. Exact calculation replay and receipt-backed line create
  are free. Reopening the modal creates a new billable session. Add without
  a fresh receipt may open a session server-side and bill at most once for
  that session, then free line create. Insufficient combined balance on the
  first unpaid success attempt returns HTTP 402 with
  `calculation_session_id` and no authoritative result, receipt, debit, or
  line; the unpaid session remains retryable after tokens are obtained.
  Starred billing is unchanged (no official modal-session rule).
- Unrelated recent work (personal/company wallets, donations, purchases,
  subscriptions/quotas, company/group/member changes, conversation ordering,
  security/deployment, and unrelated documentation cleanup) remains accepted;
  this correction only restored modal-session timing for official
  calculation billing without redesigning pricebook or financial-document
  structures.
- `INITIAL_FREE_TOKENS` (environment setting) and `PRICEBOOK_LINE_TOKEN_COST`
  (backend constant) are **deprecated**: they are no longer read by any
  billing code path. The signup grant now always comes from
  `TokenBillingPolicy.new_account_initial_grant`, and calculation costs from
  `TokenBillingPolicy.official_calculation_cost` /
  `starred_calculation_cost`. Do not treat either legacy setting as a source
  of truth.
- Company token wallets exist for a fallback funding source only. There is
  **no company → user token withdrawal** endpoint; donation
  (`POST /api/companies/{id}/token-donations/`) only moves tokens from a
  member's personal wallet into the company wallet, never back. New companies
  start at **0** company tokens. Personal and company balances are separate:
  the global account header shows personal tokens only; the company context
  header shows company tokens only.
- Manual admin grant/subscription activation is the only non-demo top-up path
  in v1.0 (plus Local/Development demo package purchase when enabled).

## Pricebook families and source layout (Phase 11)

- Authoritative building family code is `building` (`title_fa`: `ابنیه`).
  `ABN1404` is a **legacy alias only**, not the catalog identity.
- Canonical layout: `data/building_pricebook/pricebook.json` plus
  `data/building_pricebook/<year>/` with complete `prices.xlsx` at the year
  root. Non-base years are sparse structural overlays on the family
  `base_year` (currently 1404); every year still needs its own prices file.
- Operator commands: `validate_pricebook_family`,
  `materialize_pricebook_edition`, `rebuild_pricebook_family`,
  `sync_pricebooks`, and Local-only `reset_pricebook_catalog`. Prefer these
  over deprecated `bootstrap_dev_pricebook`. Year-encoded import family codes
  (e.g. recreating `ABN1404` as a family) are refused.
- Mechanical/electrical (and other) families are supported only when a valid
  `pricebook.json` + structured year sources exist. The backend does **not**
  fabricate those catalogs from PDFs.
- `PricebookEdition.source_dir` / provenance must stay durable under the
  repository `data/` root. Temporary paths (`/tmp`, pytest dirs) must never be
  stored on Local/live databases.

## Product / rendering

- PDF binary rendering remains unavailable; export download may return conflict
  while blocked.
- Deep MIME/malware content scanning is not implemented.

## API docs / OpenAPI

- Interactive schema/docs are disabled in production by default
  (`ENABLE_API_DOCS=false`, `API_DOCS_PUBLIC=false`).
- OpenAPI generation currently reports warnings for pre-existing
  coefficient/financial serializer method type hints and some operationId
  collisions. Errors: **0** after Phase 12.

## Platform admin / support (Phase 12)

- Platform admin is separate from company Owner/Admin/Employee.
- There is exactly one root Superuser; Admins cannot manage other Admins.
- Online payment verification/retry remains unavailable while
  `PAYMENTS_ENABLED=false` (demo commerce may still be enabled locally).
- Internal support notes never appear in user ticket APIs.

## Obsolete behavior (not current frontend contract)

These may still exist for compatibility or history, but must **not** be used as
the normal frontend integration path:

- `POST /api/auth/dev-login/` temporary token issuance;
- `Authorization: Token …` as primary browser auth;
- storing auth secrets in `localStorage` / `sessionStorage`.

## Historical packages

Superseded versioned frontend-doc snapshots (not canonical) live under:

- `codexphaze/v0.0/historical_frontend_docs/`
- `codexphaze/v1.0/historical_frontend_docs/`
