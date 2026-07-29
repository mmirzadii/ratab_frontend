# Phase 9 — Telegram-Inspired Company Workspace UX Simplification

## Purpose

Simplify the Ratab Frontend v1.0 company workspace and make its navigation and interaction model feel familiar, compact, and user-friendly.

The visual and interaction direction should be inspired by Telegram's clear master-detail layout, but this is not a pixel-for-pixel Telegram clone. Do not copy Telegram branding, assets, proprietary icons, exact colors, or unsupported product behavior.

This is a frontend-only UX and UI phase. Do not change backend behavior or invent backend capabilities.

## Read before changing code

Read these sources in order:

1. `AI_CODE_PRINCIPLES.md`
2. `code_oder/COMMON_FRONTEND_CODEX_RULES.md`
3. `code_oder/v1.0/COMMON_FRONTEND_CODEX_RULES.md`
4. `code_oder/active_version.txt`
5. `code_oder/v1.0/PROJECT_EXPLAIN.md`
6. `code_oder/v1.0/README.md`
7. all completed Phase 1–8 reports
8. every file under `backend_docs/current/`
9. the current AppShell, navigation, company dashboard, members, groups, projects, messaging, attachment, routing, state, RTK Query, theme, and responsive code
10. this Phase 9 instruction file

The current implementation and `backend_docs/current/OPENAPI.yaml` remain the source of truth.

## Problem to solve

The current company workspace is visually heavy and difficult to scan:

- too much width is consumed by multiple navigation areas;
- the company title/header is oversized and repeated;
- messages have a large empty canvas while the actual navigation and composer are visually disconnected;
- group selection is hidden in a form-like dropdown instead of a familiar conversation list;
- group management shows create, list, edit, and membership controls at the same time;
- many nested cards, borders, labels, and large empty areas increase cognitive load;
- desktop and mobile navigation do not yet behave like a simple list-to-detail communication app.

## UX direction

Create a compact Telegram-inspired workspace using a clear RTL master-detail structure.

### Desktop shell

Use a practical layout such as:

1. a narrow primary application rail on the far right;
2. a compact company-context list panel beside it;
3. one flexible main content pane;
4. an optional details drawer only when needed.

Avoid two wide permanent sidebars.

Reduce redundant company headers and oversized context bars. Show the company identity once in a compact, consistent location.

The main pane must use the available viewport height without causing unnecessary browser-page scrolling.

### Company-context list panel

The context panel should change based on the selected section.

Examples:

- Messages: groups/conversations list
- Groups: group list
- Members: member list
- Projects: project list

Use compact rows with:

- icon or generated avatar;
- primary title;
- short secondary text;
- selected state;
- supported status/badge only when real backend data exists.

Add search only where it is useful.

Do not invent unread counts, online status, last-seen values, typing indicators, or real-time behavior when the backend does not provide them.

### Messaging experience

Redesign the company messaging area around a familiar chat layout:

- show groups in the context list instead of using the large top dropdown as the primary navigation;
- use a compact chat header with group name, group type, and supported actions;
- keep the message area as the primary visual focus;
- render messages in readable message bubbles or clearly grouped message blocks;
- keep timestamps and attachment cards visually secondary;
- keep the composer sticky at the bottom of the main pane;
- retain the existing private-file and financial-document attachment behavior;
- do not restore project attachments;
- make the empty state smaller and less dominant;
- preserve pagination/loading/error/quota/permission behavior.

Do not create fake real-time messaging. Continue using the actual current API and refresh behavior.

### Groups experience

Replace the current all-in-one group management screen with a list-and-detail workflow:

- group list in the context panel;
- selected group details in the main pane;
- create group through a focused modal, sheet, or dedicated compact state;
- edit one selected group at a time;
- membership management in a focused section or drawer;
- avoid showing create form, edit form, group cards, and all membership controls simultaneously.

Clearly distinguish backend-supported group types:

- company public group;
- project-linked group;
- custom group.

Use real backend type/relation fields when available. Do not infer system behavior only from names.

Respect backend restrictions for public/project/system-managed groups. Do not expose delete, rename, deactivate, or membership actions when the contract does not permit them.

### Members and projects

Apply the same compact list-to-detail pattern where it materially simplifies the existing pages.

- Members: compact member list, selected-member details/actions, invitation actions in a focused modal or sheet.
- Projects: compact project list, selected-project details/actions, project creation in a focused modal or sheet.

Preserve the approved project-group creation checkbox and backend-driven group behavior.

Do not redesign the cost-report wizard in this phase except for shell compatibility or obvious navigation breakage.

### Visual simplification

Use the existing design system and theme tokens, but simplify the composition:

- fewer nested glass cards;
- fewer full-width bordered containers;
- less repeated explanatory text;
- more consistent spacing;
- compact headers and controls;
- one clear primary action per view;
- secondary and destructive actions visually separated;
- clearer selected states;
- more readable typography hierarchy;
- no oversized empty decorative regions;
- no horizontal overflow.

Keep the Persian-first RTL identity, Vazirmatn font, dark theme, and light theme.

Do not add a major UI framework solely for this redesign.

### Mobile behavior

Mobile must use a single-pane navigation flow:

- context list first;
- tap an item to open details/chat;
- a clear back action returns to the list;
- no permanent desktop sidebars;
- sticky chat composer remains reachable above the virtual keyboard;
- modals/sheets remain viewport-bounded;
- touch targets remain accessible.

Preserve route refresh and browser back behavior. Avoid hiding essential navigation only inside a difficult-to-discover drawer.

### Accessibility and states

Preserve or improve:

- keyboard navigation;
- visible focus states;
- accessible labels;
- sufficient contrast;
- loading, empty, error, disabled, and permission-denied states;
- long Persian text wrapping;
- reduced-motion behavior where applicable.

Never render raw backend HTML or raw English errors.

## Architecture rules

- Keep API access in the existing RTK Query architecture.
- Do not modify backend code.
- Do not invent endpoints, fields, permissions, or business rules.
- Do not manually edit generated OpenAPI TypeScript files.
- Do not duplicate backend state into a second permanent client-side source of truth.
- Reuse existing components where practical, but split oversized route components when that improves maintainability.
- Avoid a full rewrite of the application.
- Preserve all completed v1 behavior.
- Do not commit or push changes.

## Preserve these product flows

The redesign must not break:

- signup, login, session restore, logout, and CSRF;
- companies, invitations, roles, and permissions;
- public, project-linked, and custom group behavior;
- persistent messages;
- private-file and financial-document attachments;
- projects and project groups;
- pricebook browsing and calculation;
- coefficients;
- financial documents, locking, preview, and print;
- wallet and exact 5-token UX;
- subscriptions, quotas, and disabled payments;
- dark/light theme and RTL responsiveness.

## Suggested implementation approach

First audit and map the current shell and company workspace before editing.

Then implement the smallest coherent redesign, prioritizing:

1. shell and navigation hierarchy;
2. message group list and chat pane;
3. group list/detail management;
4. members/projects list-detail consistency;
5. responsive/mobile behavior;
6. final visual cleanup.

Do not leave the application in a half-migrated state with both the old and new navigation visible.

## Validation

Run the real available checks:

- `npm run generate:api`
- `npm run validate:docs`
- TypeScript check
- `npm run lint`
- available frontend tests
- `npm run build`

Perform manual responsive verification at representative widths, including approximately:

- 1440px desktop
- 1024px compact desktop/tablet landscape
- 768px tablet
- 390px mobile

Manually verify at least:

- opening a company;
- switching company sections;
- switching message groups;
- loading and sending messages;
- file and financial-document attachments;
- opening groups;
- creating and editing a custom group;
- viewing public and project-linked groups;
- managing allowed memberships;
- members and projects navigation;
- light/dark theme;
- keyboard focus;
- long Persian text;
- empty, loading, permission, and error states.

Record checks that cannot be executed as `Not run` with the real reason.

## Documentation and phase outputs

Keep all Phase 9 files inside:

`code_oder/v1.0/phaze9/`

Update:

- `code_oder/v1.0/PROJECT_EXPLAIN.md`
- `code_oder/v1.0/README.md`
- `code_oder/v1.0/FRONTEND_PHASES_SUMMARY.md`
- `code_oder/v1.0/phaze9/README.md`
- `code_oder/v1.0/phaze9/REPORT.md`
- `code_oder/v1.0/phaze9/TEST_RESULTS.md`
- `code_oder/v1.0/phaze9/USER_ACTIONS_REQUIRED.md`

Do not create a separate numbered output folder.

## Completion criteria

Phase 9 is complete only when:

- company navigation is noticeably simpler;
- the messages view uses a compact conversation-list/chat-pane model;
- the groups view uses a focused list/detail model;
- redundant headers, cards, and simultaneous forms are removed;
- desktop and mobile navigation are coherent;
- existing backend behavior remains intact;
- no unsupported Telegram-like feature was invented;
- TypeScript, lint, build, and available validations are recorded honestly.

Stop after completing Phase 9 and wait for review.
