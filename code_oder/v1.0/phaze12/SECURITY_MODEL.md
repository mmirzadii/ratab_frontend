# Phase 12 Security Model (Frontend)

## Ordinary users

Phone + account password. No Passkey requirement.

## Platform Admin

- Identity: Backend membership / Root Superuser (never company roles)
- Entry: Passkey assertion → Admin session
- Root: minimum **two** active Passkeys
- Delegated Admin: minimum **one**
- Critical mutations: recent Passkey step-up + reason (Backend enforces)
- Secrets/challenges: temporary memory only; never localStorage/sessionStorage/Redux persistence/URL/analytics

## Retired (do not implement)

- TOTP / QR / otpauth URI
- Recovery codes
- Administrative action password
- Action proofs / `X-Admin-Action-Proof`
- Password step-up modal for Admin panel

## Production

Exact HTTPS origins + WebAuthn RP ID must be configured on Backend. Localhost is supported for development only.
