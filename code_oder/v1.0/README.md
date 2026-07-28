# Ratab Frontend v1.0 Upgrade Phases

This directory contains the frontend upgrade plan from v0.0 to v1.0.

Rules:

- Run phases in order.
- Keep the existing frontend and extend it; do not rebuild the project from scratch.
- Use `backend_docs/current/` as the active backend contract.
- Keep every phase instruction, report, test result, and required user action inside the same `phazeN/` folder.
- Do not create separate numbered output folders.
- Stop after each phase for review.

Phase order:

1. v1 baseline and backend contract sync
2. session authentication, signup, login, and CSRF
3. company members, roles, and groups
4. persistent group messaging
5. private files and attachments
6. wallet and 5-token line-charge UX
7. subscriptions, quota, and disabled payment UX
8. final integration, regression, cleanup, and handoff
