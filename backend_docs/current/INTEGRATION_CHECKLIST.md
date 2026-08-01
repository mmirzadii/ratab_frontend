# Frontend integration checklist

- [ ] Configure API base URL per environment (no secrets in the repo).
- [ ] Generate TypeScript (or other) types from `OPENAPI.yaml`.
- [ ] Enable `credentials: "include"` on all API calls.
- [ ] Bootstrap CSRF via `GET /api/auth/csrf/` and send `X-CSRFToken` on mutations.
- [ ] Implement signup start → verify → complete → session.
- [ ] Implement login / me / logout (204).
- [ ] Session restore on app start via `/api/auth/me/`.
- [ ] Route guards for authenticated vs public screens.
- [ ] Company switcher and role-aware UI (still handle 403).
- [ ] Exactly-one-owner UX; ownership transfer endpoint; never assign `owner`
      via invite/role APIs.
- [ ] Render role-scoped `configurable_permissions` with `label_fa` + `value`.
      For Admin targets, show Admin-only switches; treat Employee capabilities as
      inherited/`effective_permissions` (do not duplicate Employee switch UI).
- [ ] Load via `GET /api/company-members/{id}/settings/`; persist with
      `permission_settings` on PATCH.
- [ ] Trust `can_edit_member`, `can_change_role`, `assignable_roles`, and
      `edit_denied_reason` from the API (owner never editable; admin cannot
      edit admin; employee cannot manage members).
- [ ] Invitation UX: company invitations are separate from custom-group
      invitations; pending company invites are not memberships; accept/reject
      flows; existing members may still be added directly after group create.
- [ ] Custom group create: `POST /api/companies/{id}/groups/` with `name`,
      optional `description`, optional `member_ids`; creator is active
      immediately; selected members get pending invitations until accept.
      Use `GET .../members/?active_only=true&q=` for the picker.
- [ ] After company create, pin `group_type=public` / `pin_priority=0` (`عمومی`);
      never offer delete/rename/retype for that group. Order other groups by
      response `last_activity_at` from the backend list (not client-side message scans).
- [ ] Project create uses `include_all_company_members_in_group` (default true);
      refresh via returned `group_id` and group `project` fields. Future company
      accepts auto-join only when the policy remains true.
- [ ] Chat-first UX: conversations are groups; use project relation from the
      group payload (do not infer from name).
- [ ] One FD attach flow: select or create-then-attach via message attachments.
- [ ] Project-group FD list/create uses group endpoints without overriding
      project; public/custom require explicit `project_id`.
- [ ] Shared-resources browse for FD / files / links (paginated, members only).
- [ ] Groups + membership UX; messaging only for group members.
- [ ] Message attachments: only `file` and `financial_document` (no `project`).
- [ ] Message send: use optional `client_message_id`; treat response `id` +
      `created_at` as server-confirmed sent (not a read receipt).
- [ ] Message edit/delete/forward UI driven only by `can_edit` / `can_delete` /
      `can_forward`. Soft-delete shows tombstone `پیام حذف شد`.
- [ ] Forward to eligible same-company groups, including the source group;
      handle `MESSAGE_FORWARD_TARGET_INVALID` and
      `MESSAGE_ATTACHMENT_FORWARD_DENIED`.
- [ ] Page-number pagination (`page`, size 50).
- [ ] Map field validation errors into forms.
- [ ] Handle stable `code` errors from `ERROR_CODES.md`.
- [ ] Multipart company file upload; authorized open/download only.
- [ ] Financial document lock UI + backend conflict handling.
- [ ] Pricebook family/year UX (Phase 11): family dropdown from
      `GET /api/pricebooks/` using `title_fa` only (e.g. `ابنیه` for
      `building`) — never year in the family label, never treat `ABN1404` as
      the family code. Year dropdown from
      `GET /api/pricebooks/{id}/editions/` (active + non-stale, newest first);
      default to `latest_available_year`. Prefer submit
      `pricebook_edition_ids` (server resolves official sets); legacy
      `pricebook_edition_id` + `price_set_id` still works for one edition.
      Handle 400 when create/add rejects stale/inactive editions. Existing
      documents expose `selected_pricebooks`; singular fields are primary only.
      Multi-selection line create must send `document_pricebook_id`.
- [ ] Pricebook browse (chapters → groups → items); keep row codes as strings.
- [ ] Official modal session: on item modal open, call
      `POST .../official-calculation-sessions/` (free) and store
      `calculation_session_id`. Do not reuse a session after the modal closes.
- [ ] Calculation billing flow: `POST .../official-calculations/` or
      `POST /api/pricebook-items/{id}/calculate/` with
      `calculation_session_id` + `idempotency_key` (+ `financial_document_id`
      on the pricebook endpoint). First successful calculation in the session
      charges tokens; later successes in the same open session are free and
      refresh the latest receipt. `POST .../lines/` with that latest
      `calculation_receipt_id` creates the line for **free**.
- [ ] Starred: `POST .../starred-calculations/` still bills per successful
      starred calculation (no modal session).
- [ ] Add-without-receipt fallback is supported: `POST .../lines/` with
      `pricebook_item_id` + calculation inputs + required `idempotency_key`
      opens/reuses a session server-side and bills at most once for that
      session, then creates the line. Prefer receipt-backed create when a
      fresh latest receipt already exists.
- [ ] Opening/editing a pricebook item is free; only the first successful
      authoritative calculation in a modal session bills official tokens.
      Frontend must not decide cost or billing authority (no client
      `already_paid`).
- [ ] Read live calculation costs from `GET /api/token-wallet/`
      (`official_calculation_cost`, `starred_calculation_cost`) instead of
      hardcoding token amounts; they are admin-configurable.
- [ ] Show the one-time signup grant (`new_account_initial_grant`, default 12)
      in onboarding copy without hardcoding it either.
- [ ] Company token wallet UX: `GET /api/companies/{id}/token-wallet/`
      (`fallback_available`) and donation flow via
      `GET|POST /api/companies/{id}/token-donations/` (any active member can
      donate from their personal balance; no company→user withdrawal exists).
- [ ] Wallet refresh (personal + company) after every billed calculation and
      after a donation.
- [ ] Always send `idempotency_key` for calculation, receipt-backed line
      create, and donation calls that may be retried.
- [ ] Handle 402 `INSUFFICIENT_COMBINED_TOKEN_BALANCE` on calculation
      endpoints and Add-without-receipt (show personal + company balances,
      `calculation_session_id` for official, `official_calculation_cost` /
      `starred_calculation_cost`, no result) and
      402 `INSUFFICIENT_PERSONAL_TOKEN_BALANCE` on donations (personal only).
- [ ] Handle 200 idempotent replay for calculations (`replayed: true`) and for
      receipt-backed / Add-fallback line create (`Idempotent-Replayed: true`
      header). Reject stale receipts when Add uses a superseded receipt id.
- [ ] Show subscription + message quota; handle 429 quota exceeded.
- [ ] Treat the effective plan as a single-source invariant: exactly one plan
      is effective per user at all times — a valid paid subscription, or
      Bronze as the free fallback when there is none. Never render "no plan"
      or multiple "current" plans.
- [ ] On the plans screen, use `is_available` (catalog listing), `is_current`
      (exactly one true), `is_free_fallback` (Bronze), and `can_activate`
      (paid + available + not already current) as four distinct flags — do
      not conflate them.
- [ ] Read `effective_plan_code`, `effective_daily_message_limit`, and
      `effective_max_attachment_bytes` from `GET /api/subscription/` (or the
      `plan_code`/`daily_limit` fields from `GET /api/message-quota/`) instead
      of hardcoding Bronze/Silver/Gold limits.
- [ ] Gold currently has `is_available: false`; hide/disable its activation
      control and do not treat it as reachable via any current API.
- [ ] Disabled real-payment UX (`PAYMENTS_DISABLED`); no client payment amounts.
- [ ] Local/Development demo Buy via `POST /api/payments/demo-purchase/` only
      when `GET /api/token-wallet/` → `commerce.demo_purchase_available` is
      true; never credit tokens in the client; handle 201 / 200 replay /
      409 `IDEMPOTENCY_KEY_REUSED` / 403 `DEMO_COMMERCE_DISABLED`.
- [ ] Local/dev/prod origin, HTTPS, and cookie `SameSite` configuration.
- [ ] Automated tests for auth, CSRF failure refresh, and charged-line retry.
- [ ] Never store passwords/session IDs in web storage.
- [ ] Never use Token/`dev-login` as the normal browser auth path.
