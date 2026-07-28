# Phase 1 — v1 Baseline and Backend Contract Sync

Read the common rules and all current backend-contract files before starting.

## Goal

Create a safe v1 frontend baseline without implementing a new user feature.

## Work

- Inspect the existing v0 frontend structure, routes, state, API modules, generated schema, and current build/lint/test commands.
- Verify that `backend_docs/current/` is complete, internally consistent, and marked as Backend v1.0.
- Update the OpenAPI TypeScript generation path to the current contract and regenerate types.
- Create/update the v1 version documentation under `code_oder/v1.0/` from the real implemented frontend.
- Record the v0 behavior that must remain stable and the exact integration areas for the remaining phases.
- Change `code_oder/active_version.txt` to `v1.0` only after the baseline and contract checks succeed.
- Do not implement authentication, messaging, files, wallet, quota, or subscription UI in this phase.

Run the existing relevant validation commands, update the phase reports in `phaze1/`, and stop.
