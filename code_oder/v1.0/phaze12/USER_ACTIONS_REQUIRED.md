# User Actions Required

## Backend / ops

- Configure WebAuthn RP ID, RP name, and allowed origins (localhost for local; exact HTTPS in production)
- Bootstrap Root Superuser and register **two** Passkeys
- Document Root recovery via secure server command (no web bypass)
- Review capability catalog before production

## Frontend (manual verification)

- Ordinary user login unchanged; no Passkey prompt
- Pending Admin → enrollment with account password → Passkey create
- Root after first Passkey stays on second-Passkey screen
- Admin entry uses Passkey verification (no TOTP / recovery / action password)
- Public ticket reply does not open Passkey step-up
- Critical Admin mutation triggers Passkey step-up then succeeds
- `/admin/security` list/rename/add/delete respects minimum counts
- Root can reset delegated Admin Passkeys with reason + step-up
- Light/dark/mobile/RTL Passkey pages
