# Phase 12 Frontend Report

Status: **complete** (Passkey / WebAuthn security model)

## Goal

Secure platform-admin UX with Passkey enrollment/verification, Admin session, Passkey step-up for critical mutations, capability-driven modules, and Root-only Admin management.

## Obsolete removed

- Password `StepUpDialog` / `StepUpProvider` / `stepUpContext`
- Legacy `/api/platform-admin/step-up/` client usage
- No TOTP/QR/otpauth/recovery/action-proof UI remained in this tree (prior state was password step-up)

## Passkey components added

- `AdminSecurityProvider` + `AdminGate`
- `AdminPasskeyScreens` (enrollment, Root second key, verification, blocked states)
- `AdminPasskeyStepUpDialog`
- `AdminSecurityPage` (`/admin/security`)
- `adminPasskeyClient` (fetch ceremonies; no RTK cache for challenges)
- `webauthnBase64url` + `adminWebAuthn`
- Root reset Passkeys on `AdminAdminDetailPage`

## AdminGate

Routes via Backend `security/status.next_step`. Protected Admin modules render only for `admin_dashboard`.

## Critical step-up

`runWithPasskeyStepUp`: attempt mutation → on `ADMIN_PASSKEY_STEP_UP_REQUIRED` run WebAuthn get → retry once.

## Generated API

Synced Backend `frontend_docs` → `backend_docs/current`, applied GroupMessage OpenAPI fix script, `npm run generate:api` (no hand-edit of `schema.ts`).

## Validation

See `TEST_RESULTS.md`.

## Remaining limitations

- OpenAPI stubs many WebAuthn bodies as `Reason`; runtime shapes follow Backend handoff/views.
- `security_reset_required` / `membership_pending` supported in gate; Backend primarily emits `passkey_enrollment`.
- Browser WebAuthn support required (secure context / PublicKeyCredential).
- Manual device Passkey ceremony cannot be fully automated in Node contract tests.

## Out of scope

- Backend code changes
- Phase 13
- Commit / push
