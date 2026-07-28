# Phase 3 — Company Members, Roles, and Groups

Read the common rules, current backend company/group/permission contract, prior reports, and existing company/project UI.

## Goal

Integrate the v1 company workspace model while preserving the existing company and project flows.

## Work

- Add the backend-supported member, role, and group data to the current frontend architecture.
- Add the required management and viewing UI based on actual permissions.
- Update company navigation/dashboard integration where needed.
- Handle owner, admin, employee, non-member, forbidden, empty, and loading states from the real contract.
- Keep backend authorization authoritative and preserve last-owner protection behavior in the UX.
- Avoid broad redesign or unrelated route changes.

Run the relevant checks, update `phaze3/` reports, and stop.
