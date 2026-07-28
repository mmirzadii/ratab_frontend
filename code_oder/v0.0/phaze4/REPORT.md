# Frontend Phase 4 Report

## Summary

Status: done.

Phase 4 adds the authenticated company list/create flow and the first company dashboard shell. The root authenticated route now leads to the company flow, companies are loaded and created through the documented backend API, and successful company creation navigates directly into the created company dashboard.

## Scope

- Implemented only frontend Phase 4 company list/create and company dashboard shell behavior.
- Used `GET /api/companies/`, `POST /api/companies/`, and `GET /api/companies/{id}/`.
- Kept `/status` as the existing health/status route.
- Did not implement projects, pricebook browsing, financial document creation, real messages, or the real add cost-report flow.
- Did not modify backend code, Docker files, or deployment configuration.

## Files Created

- `src/features/companies/companyApi.ts`
- `src/pages/CompanyListPage.tsx`
- `src/pages/CompanyDashboardPage.tsx`
- `code_oder/v0.0/phaze4/REPORT.md`
- `code_oder/v0.0/phaze4/TEST_RESULTS.md`

## Files Modified

- `src/app/router.tsx`
- `src/shared/api/baseApi.ts`
- `src/shared/components/RightSidebar.tsx`
- `src/shared/components/GuidedTour.tsx`

Existing uncommitted Phase 3 files were present before Phase 4 and were preserved.

## Implementation Details

- Added RTK Query company endpoints using generated OpenAPI schema types:
  - `useListCompaniesQuery`
  - `useCreateCompanyMutation`
  - `useRetrieveCompanyQuery`
- Added `Company` cache tags to `baseApi`.
- Changed authenticated `/` to redirect to `/companies`.
- Added `/companies` for the real company list/create page.
- Added `/companies/:companyId` for the company dashboard shell.
- Built a Persian RTL company list page with loading, empty, error, refresh, populated, and create-form states.
- Company creation sends only backend-supported fields:
  - `name`
  - `legal_name`
  - `registration_number`
  - `national_id`
  - `active_slug`
- Empty optional create fields are omitted from the request payload.
- Registration and national ID inputs normalize localized digits before submission.
- Successful company creation navigates to `/companies/{id}`.
- Reused the Phase 3 create-company highlight state for the add-company CTA.
- Added a company dashboard shell with global right navigation plus company-local navigation.
- The company dashboard default page is `پیام‌های شرکت`.
- The messages page is a placeholder only and does not render fake backend messages.
- Added a disabled bottom-left `صورت‌بها` plus button with onboarding/highlight copy for the future flow.
- Updated guided tour copy for company list and company dashboard contexts.

## UI/UX Notes

- UI remains Persian-first and RTL.
- Dark glassmorphism, emerald/teal accents, and light-mode compatibility were preserved.
- Disabled future company-nav entries are clearly marked as future-phase behavior.
- The bottom-left plus button is visually prominent but intentionally non-functional in Phase 4.

## API Contract Notes

- Used `backend_docs/history/v0.0/frontend_handoff_v0_0.md`.
- Used generated types from `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`.
- The prompt-required exact schema filename `backend_docs/history/v0.0/OPENAPI.yaml` is still absent.
- No unsupported company fields or endpoints were introduced.

## Docker / Deployment Notes

Docker files were not changed in Phase 4.

Because `docker/`, `.dockerignore`, and compose files were unchanged, Docker build was not required for this phase.

## Issues and Findings

- No frontend test runner or test files are configured yet.
- Browser-level route smoke verification was attempted with Vite preview, but route status lines were not captured reliably by the tool. The already-running local dev server on port `5173` returned HTTP 200 for `/`, `/companies`, `/companies/1`, and `/status`.
- Manual browser review is still needed for real dev-backend company creation because it mutates backend data.
- Existing Phase 3 uncommitted changes are still present in the working tree.

## Risks and Assumptions

- Assumed `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` remains the authoritative schema source.
- Assumed Phase 3 auth/session behavior is the base for Phase 4 and should not be reverted.
- Assumed company creation is acceptable as the only real Phase 4 mutation.
- Assumed project, financial document, pricebook, and real company message flows remain future phases.
- Backend company access isolation is relied on for unauthorized company detail/list access.

## User Actions Required

- Manually test `/login` then `/companies` against the dev backend with a disposable dev user.
- Create a test company and confirm the app navigates to `/companies/{id}`.
- Confirm the company dashboard shows the correct company name and the `پیام‌های شرکت` default page.
- Confirm the bottom-left `صورت‌بها` plus button is visibly highlighted but does not open a real flow yet.
- Review the Phase 4 UI at desktop and mobile widths.
- Confirm whether the OpenAPI schema should remain `backend_docs/history/v0.0/OPENAPI.NON_CANONICAL.openapi_v0_0.yaml` or be manually copied/renamed to `backend_docs/history/v0.0/OPENAPI.yaml`.

## Suggested Commit Message

feat(frontend-phase4): add company creation and dashboard shell

## Next Step

After manual company-flow review, proceed only with frontend Phase 5.
