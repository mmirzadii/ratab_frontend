# Phase 3 Report — Company Members, Roles, and Groups

Date: 2026-07-28  
Frontend active version: `v1.0`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)  
Primary authority: `code_oder/v1.0/phaze3/FRONTEND_PHASE_03_INSTRUCTIONS.md`

## Understanding

Extend the existing company dashboard with Backend v1 workspace contracts:

- Members list / add / role change / deactivate / remove
- Groups list / create / update / deactivate
- Group membership list / add / deactivate / remove
- Role-aware company navigation and company-info edit UX

Do **not** implement persistent messaging, attachments, files, wallet, subscriptions, or payments.

## Contract sources used

- `OPENAPI.yaml` — paths and schemas for companies, company-members, company-groups, company-group-memberships
- `PERMISSIONS.md` — owner / admin / employee matrix and last-owner rule
- `FRONTEND_HANDOFF.md`, `ERROR_CODES.md`, generated `schema.ts`

Roles used exactly as contracted: `owner` | `admin` | `employee`.

## Implementation

### Shared API tags

`src/shared/api/baseApi.ts` tag types added: `CompanyMember`, `CompanyGroup`.

### New feature modules

| File | Responsibility |
| --- | --- |
| `src/features/companies/companyMembersApi.ts` | Members RTK Query endpoints |
| `src/features/companies/companyGroupsApi.ts` | Groups + memberships RTK Query endpoints |
| `src/features/companies/companyPermissions.ts` | UX helpers from `PERMISSIONS.md` |
| `src/features/companies/MembersSection.tsx` | Members management / viewing UI |
| `src/features/companies/GroupsSection.tsx` | Groups + membership UI |

### Member endpoints wired

- `GET/POST /api/companies/{id}/members/`
- `PATCH /api/company-members/{id}/role/`
- `POST /api/company-members/{id}/deactivate/`
- `DELETE /api/company-members/{id}/`

### Group endpoints wired

- `GET/POST /api/companies/{id}/groups/`
- `PATCH /api/company-groups/{id}/`
- `POST /api/company-groups/{id}/deactivate/`
- `GET/POST /api/company-groups/{id}/members/`
- `POST /api/company-group-memberships/{id}/deactivate/`
- `DELETE /api/company-group-memberships/{id}/`

### Dashboard / navigation

`CompanyDashboardPage` extended (not rewritten):

- New sections: `members`, `groups`
- Secondary nav enables Members and Groups (coefficients/settings remain disabled placeholders)
- Mobile tabs include members and groups
- Company info panel accepts `canEdit` from current membership role
- Current role resolved by matching `auth.user.id` to `CompanyMember.user_id`

### Permission-aware UX (not security)

| Actor | UX behavior |
| --- | --- |
| Employee | View members; no add/role/deactivate/remove; company info read-only; can create groups; manage only groups they created while still a member |
| Admin | Manage employees only; update company; manage all groups |
| Owner | Manage any role except last active owner demote/remove; update company; manage all groups |
| Any active member | Create groups |

Backend 403/409 responses still surface via existing `getApiErrorMessage` toasts. UI disable/hide is convenience only.

### Preserved Phase 1 / Phase 2 behavior

- Session cookies + CSRF (`credentials: "include"`, `X-CSRFToken`) unchanged
- Signup/login/logout/session restore unchanged
- Local-only company messages still local (Phase 4)
- Projects / cost reports / pricebooks / coefficients flows unchanged
- Generated `schema.ts` not hand-edited

## Intentionally out of scope

- Persistent group-message UI
- Message attachments / private files / financial-document attachments
- Wallet / 5-token UX
- Subscriptions / message quotas / payments
- Coefficients and settings nav destinations
- Broad redesign

## Contract notes / mismatches

1. OpenAPI still advertises `tokenAuth` alongside `cookieAuth` on these endpoints. Frontend continues Phase 2 cookie + CSRF only; no Token auth restored.
2. Employee group list filtering is backend-owned; frontend renders whatever the list endpoint returns.
3. No automated frontend test runner exists in `package.json`; permission helpers are covered by TypeScript/lint/build plus manual checklist only.
4. No conflict found that required inventing fields or endpoints. Where Phase 3 summary language is broader than the instruction file, the instruction file + `backend_docs/current/` were followed.

## Risks / remaining limitations

- Non-member / forbidden company retrieve still handled by existing company detail error empty-state.
- Last-owner protection is dual: UX disables demote/remove; backend remains authoritative.
- Default company group behavior (`is_default`) is displayed but not specially reinvented.
- Coefficients / settings nav items remain disabled placeholders for later work.
- Live multi-role verification against a running backend still needs manual QA (see `USER_ACTIONS_REQUIRED.md`).

## Stop point

Phase 3 complete for review. Phase 4 (persisted messaging) not started. No commit/push performed.
