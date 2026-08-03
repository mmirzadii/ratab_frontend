# Ratab Frontend v1.0 Phase 12
## Secure Admin Panel — Passkey / WebAuthn, Capabilities, Commerce, Tickets

Use corrected Backend Phase 12 OpenAPI/handoff as authority.

Do not invent API fields. Do not modify Backend. Do not create Phase 13. Do not commit/push.

## Ordinary users

Ordinary users (including Company Owner/Manager/Employee) continue phone + account password login.
**Passkeys are not required** for ordinary users.

## Platform Admin entry

```text
normal login → open /admin → Passkey verify → Admin panel
```

Drive shell routing from `GET /api/platform-admin/security/status/` (`next_step`).

### AdminGate states (Backend authoritative)

- `not_platform_admin`
- `passkey_enrollment` / `membership_pending` / `security_reset_required`
- `additional_root_passkey_required` (Root needs **two** Passkeys)
- `admin_passkey_verification`
- `admin_dashboard`
- `suspended` / `revoked`

### Enrollment

1. Account password reauth (`رمز ورود حساب`) → `/passkeys/enrollment/reauthenticate/`
2. Registration options → `navigator.credentials.create()`
3. Verify → refetch status

Wrong password: clear field, stay on page, do **not** request options / create().

### Admin session

`/session/webauthn/options|verify/` — short-lived Admin session (server cookie/session).
Never store Admin session tokens or WebAuthn challenges in localStorage.

### Critical mutations

On `ADMIN_PASSKEY_STEP_UP_REQUIRED`:

1. Passkey step-up (`/step-up/webauthn/`)
2. Retry mutation **exactly once**
3. Clear ceremony data

No action-password, TOTP, recovery codes, or `X-Admin-Action-Proof`.

Public ticket reply: Admin session only — **no** step-up.

### Passkey management

`/admin/security` — list/rename/add/delete (safe fields only).
Root reset of delegated Admin: `بازنشانی امنیت ورود مدیر` + reason + Passkey step-up.

Root recovery with zero usable Passkeys is **server-side only** (no web bypass).

## WebAuthn

- Local browser APIs only
- Central base64url helpers (`webauthnBase64url.ts`)
- Ceremony client bypasses RTK Query caches (`adminPasskeyClient.ts`)
