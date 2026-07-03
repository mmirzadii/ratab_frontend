# AI Code Principles — Ratab Frontend v0.0

These rules apply to every AI/Codex task in the Ratab frontend repository.

## Technology

Use:

```text
React + TypeScript + Vite + Redux Toolkit + RTK Query + Tailwind CSS
React Router
React Hook Form + Zod where useful
```

## Product

Product name: **ratab / رتب**.

The frontend is Persian-first, RTL, simple, secure, visually polished, and user-friendly for construction users.

v0.0 must support:

- phone-based dev login/register UI;
- company list and create company;
- automatic entry to company dashboard after creation;
- dual-navigation company dashboard;
- messenger-like company messages page;
- bottom-left plus button for adding صورت‌بها;
- cost report/project setup wizard;
- pricebook year default `1404`;
- pricebook chapter filters and group filters;
- item modal with price, footnotes, `requirments`, starred/manual price UI, and calculation;
- coefficients;
- financial documents;
- HTML preview/export metadata behavior.

## Backend references

Always read before coding:

```text
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```

Rules:

- Treat the YAML as the main API contract.
- Do not invent endpoints.
- Do not guess request/response fields.
- If docs and YAML conflict, stop and report.
- Do not modify backend code.

Current backend dev URL:

```text
https://hw2momirzadipayload.darkube.ir
```

Use env, not hardcoding:

```env
VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

## UI references

Use as visual references:

```text
code_oder/v0.0/reference/main_updated.html
code_oder/v0.0/reference/UI_THEME_NOTES.md
code_oder/v0.0/reference/PRODUCT_FLOW_NOTES.md
code_oder/v0.0/reference/company_dual_nav_reference.png
```

`main_updated.html` defines the dark/glass/emerald/RTL visual direction. The screenshot is only a structural reference for dual navigation; do not copy Hamravesh branding.

## Auth rules

Target UX:

- no OTP for now;
- phone number first;
- password/registration secret next if backend supports it;
- returning users use phone + password/secret;
- if backend only supports dev-login without password, do not fake password security; implement supported flow and report mismatch.

Use token auth:

```http
Authorization: Token <token>
```

Never log tokens/passwords.

## Company dashboard rules

After login:

- show company list;
- make `افزودن شرکت` prominent;
- after company creation, navigate into company dashboard;
- company dashboard has two nav areas: main dashboard nav and company nav;
- default company page is `پیام‌های شرکت`;
- bottom-left plus button opens add صورت‌بها flow;
- first-time toolbar/onboarding highlights add company and add صورت‌بها.

## Pricebook rules

- Preserve row codes as strings.
- Preserve leading zeros.
- Do not embed pricebook data in frontend.
- Do not treat missing official price as zero.
- Chapter 99/manual-price rows require explicit handling.
- If backend cannot yet calculate manual-price rows, block with a clear Persian message.

## Financial rules

- Backend calculations are source of truth.
- Do not use JS floats for authoritative totals.
- Do not recalculate official totals in frontend.
- Format money only for display.

## Security rules

- No real `.env` files in git.
- No secrets in code/docs/tests.
- Do not expose tokens.
- Respect backend company/project access isolation.
- Protected screens require auth.
- Use sandbox/controlled rendering for backend HTML preview.

## Phase rules

For every phase, create/update only:

```text
code_oder/v0.0/phazeN/REPORT.md
code_oder/v0.0/phazeN/TEST_RESULTS.md
```

Do not create extra phase reports.

Suggested commit messages follow:

```text
type(frontend-phaseN): summary
```

## Active version documentation

The active frontend version is stored in:

```text
code_oder/active_version.txt
```

For every update, first check the active version and update the matching project explanation file:

```text
code_oder/<active-version>/PROJECT_EXPLAIN.md
```

If the active version changes, update `code_oder/active_version.txt` and create/update the corresponding `PROJECT_EXPLAIN.md`. Keep the project explanation synchronized with code behavior, architecture, routes, APIs, state, commands, and known limitations after every frontend change.
