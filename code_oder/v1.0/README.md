# Ratab Frontend v1.0 Upgrade Phases

This directory contains the frontend upgrade plan from v0.0 to v1.0.

**Status: Phases 1–9 completed (2026-07-28).** Awaiting Phase 9 review.

Rules:

- Run phases in order.
- Keep the existing frontend and extend it; do not rebuild the project from scratch.
- Use `backend_docs/current/` as the active backend contract.
- Keep every phase instruction, report, test result, and required user action inside the same `phazeN/` folder.
- Do not create separate numbered output folders.
- Stop after each phase for review.

Phase order:

1. v1 baseline and backend contract sync — **completed 2026-07-28**
2. session authentication, signup, login, and CSRF — **completed 2026-07-28**
3. company members, roles, and groups — **completed 2026-07-28**
4. persistent group messaging — **completed 2026-07-28**
5. private files and attachments — **completed 2026-07-28**
6. wallet foundations (later corrected to calculation-based billing) — **completed 2026-07-28**; **billing correction 2026-07-30**
7. subscriptions, quota, and disabled payment UX — **completed 2026-07-28**
8. final integration, regression, cleanup, and handoff — **completed 2026-07-28**
9. Telegram-inspired company workspace UX simplification — **completed 2026-07-28**

## Current baseline (after calculation-billing correction)

- Frontend active version: `code_oder/active_version.txt` = `v1.0`
- Package version: `package.json` = `1.0.0`
- Backend contract: `backend_docs/current/BACKEND_VERSION` = `v1.0`
- OpenAPI generation: `backend_docs/current/OPENAPI.yaml` → `src/shared/api/generated/schema.ts`
- Browser auth: session cookies + CSRF (signup/login/logout/restore)
- Workspace: conversation-first RTL shell (گفتگوها + اعضا + شرکت); project/group create via list `+`; composer **افزودن** (فایل | صورت‌بها); list-first صورت‌بها selector; drawer tabs صورت‌بهاها / فایل‌ها / لینک‌ها / اعضا
- Billing UX: personal + company wallets; paid explicit `محاسبه` (official/starred) with receipt-based Add; donation to company; costs from backend policy; subscription/quota; disabled payment
- Handoff: root `README.md`, `PROJECT_EXPLAIN.md`, `phaze8/` + `phaze9/` reports

See `PROJECT_EXPLAIN.md` and each `phazeN/REPORT.md` for details.
