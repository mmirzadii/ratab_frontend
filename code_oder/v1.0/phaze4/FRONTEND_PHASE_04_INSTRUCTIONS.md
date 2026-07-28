# Phase 4 — Persistent Group Messaging

Read the common rules, messaging contract, prior reports, and the existing local company-message implementation.

## Goal

Replace local-only company messages with backend-persisted group messages.

## Work

- Connect the existing message UI to the current group-message API.
- Add group selection/context where required by the backend contract.
- Support history loading/pagination, sending, reload persistence, empty/loading/error/forbidden states, and safe retry behavior.
- Preserve the existing shell and responsive UI patterns.
- Remove local-only message persistence and temporary workarounds only when the server-backed replacement is complete.
- Do not add file attachments in this phase unless the backend contract makes a minimal shared message structure unavoidable.

Run the relevant checks, update `phaze4/` reports, and stop.
