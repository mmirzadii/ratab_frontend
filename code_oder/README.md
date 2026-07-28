# code_oder — Frontend Phase Instructions

This tree contains **frontend phase instructions**, phase reports, shared Codex rules, and version-level project explanations only.

Do not store backend OpenAPI/handoff contracts here (`backend_docs/`).
Do not store product/UI reference HTML/PNG/theme notes here (`docs/product_reference/`).

Do not rename this folder to `code_order` unless the project owner explicitly requests a migration.

## Version concepts (do not conflate)

| Identifier | Meaning |
| --- | --- |
| `code_oder/active_version.txt` | Active **frontend implementation** phase version |
| `backend_docs/current/BACKEND_VERSION` | Active **backend contract** version being integrated |

These are separate. Updating one does not imply updating the other.

## Layout

```text
code_oder/
├── README.md
├── active_version.txt
├── COMMON_FRONTEND_CODEX_RULES.md
├── RESET_FRONTEND_PHASE1_COMMANDS.md
├── RUN_FRONTEND_PHASE_PROMPT_TEMPLATE.md
└── v0.0/
    ├── FRONTEND_PHASES_SUMMARY.md
    ├── PROJECT_EXPLAIN.md
    ├── phaze1/
    ├── phaze2/
    └── ...
```

## Active version

Read `active_version.txt` first. The matching project explanation is:

```text
code_oder/<active-version>/PROJECT_EXPLAIN.md
```

Current active frontend version remains `v0.0` until a complete approved Frontend v1 phase plan exists.
