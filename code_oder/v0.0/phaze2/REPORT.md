# Frontend Phase 2 Report

## Summary

Status: done.

Phase 2 added the RTL design-system foundation, reusable shell primitives, a polished static dashboard preview, persisted onboarding state, a guided tour base, and Persian/Arabic digit normalization utilities.

## Scope

- Kept the existing Phase 1 scaffold and RTK Query/OpenAPI setup.
- Moved the existing health/status experience to `/status`.
- Made `/` a Phase 2 workspace preview/status surface with static UI copy only.
- Did not implement auth, company APIs, pricebook APIs, financial document flows, or backend behavior.
- Did not change Docker deployment files.

## Files Created

- `src/pages/DashboardPreviewPage.tsx`
- `src/shared/components/Button.tsx`
- `src/shared/components/EmptyState.tsx`
- `src/shared/components/GuidedTour.tsx`
- `src/shared/components/IconButton.tsx`
- `src/shared/components/RightSidebar.tsx`
- `src/shared/components/StatusBadge.tsx`
- `src/shared/components/ThemeToggle.tsx`
- `src/shared/components/Tooltip.tsx`
- `src/shared/components/TopHeader.tsx`
- `src/shared/utils/classNames.ts`
- `src/shared/utils/numberText.ts`
- `code_oder/v0.0/phaze2/REPORT.md`
- `code_oder/v0.0/phaze2/TEST_RESULTS.md`

## Files Modified

- `src/app/App.tsx`
- `src/app/router.tsx`
- `src/features/ui/uiSlice.ts`
- `src/features/ui/usePersistedTheme.ts`
- `src/shared/components/AppShell.tsx`
- `src/shared/components/GlassCard.tsx`

## Implementation Details

- Refactored `AppShell` to compose `RightSidebar`, `TopHeader`, and `GuidedTour`.
- Added shared primitives for buttons, icon buttons, badges, tooltips, empty states, and glass cards.
- Added `/status` for the Phase 1 backend health screen.
- Added `/` as a static Phase 2 dashboard preview that explicitly says it is not an operational dashboard.
- Extended UI Redux state with `hasDismissedOnboarding` and `activeTourStep`.
- Persisted theme and onboarding dismissal in `localStorage`.
- Added digit helpers that normalize Persian and Arabic numerals to Latin numerals while preserving row-code strings and leading zeros.

## UI/UX Notes

- UI remains Persian-first and RTL.
- Visual language follows the dark glassmorphism, emerald/teal, violet, and amber direction from the reference HTML.
- Light mode remains supported through the existing `light:` Tailwind variant.
- Guided tour is intentionally a base/foundation only and does not claim future auth/company flows are available.
- Disabled future-phase actions are labeled as future work and do not call fake APIs.

## API Contract Notes

- No new backend endpoint calls were added.
- Existing RTK Query health endpoint remains the only API call.
- Used the existing generated OpenAPI type setup from `backend_docs/v0.0/openapi_v0_0.yaml`.
- The prompt-required exact schema filename `backend_docs/v0.0/ratab v0.0 Backend API.yaml` is still absent; the available schema remains `backend_docs/v0.0/openapi_v0_0.yaml`.

## Docker / Online Dev Deployment Notes

Docker files were not changed in Phase 2.

Because `docker/frontend/Dockerfile`, `docker/frontend/nginx.conf`, and `.dockerignore` were unchanged, Docker build was not required for this phase.

## Issues and Findings

- No test runner or test files are configured yet.
- The exact spaced OpenAPI schema filename requested by the wrapper prompt is absent.
- Local Vite route checks verify HTTP 200 for `/` and `/status`, but visual browser review is still recommended.

## Risks and Assumptions

- Assumed `backend_docs/v0.0/openapi_v0_0.yaml` remains the authoritative schema source.
- Assumed Phase 2 should not add a test runner because the plan explicitly avoids adding one unless already present.
- Assumed the dashboard preview should remain static to avoid fake backend behavior.

## User Actions Required

- Review `/` in a browser for RTL layout, dashboard preview polish, light/dark mode, and guided tour behavior.
- Review `/status` in a browser to confirm the Phase 1 health screen still works.
- Confirm whether the OpenAPI schema should remain `backend_docs/v0.0/openapi_v0_0.yaml` or be manually copied/renamed to `backend_docs/v0.0/ratab v0.0 Backend API.yaml`.

## Suggested Commit Message

feat(frontend-phase2): add RTL design system and onboarding foundation

## Next Step

After visual review, proceed only with frontend Phase 3 for phone-based dev auth UI and protected shell.
