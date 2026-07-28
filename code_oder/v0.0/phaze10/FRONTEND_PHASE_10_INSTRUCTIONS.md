# Frontend v0.0 Phase 10 — UX Corrections, Metril Rebrand, Mobile Polish, Messenger Flow, and Calculation Modal Refinement

Use this file as the complete instruction for Codex when running Frontend Phase 10.

## Phase title

```text
Frontend Phase 10 — v0.0 UX Corrections and Metril Polish
```

## Phase goal

Phase 10 is a corrective UX/polish phase after Phases 1–9.

The goal is to make the current v0.0 frontend easier, cleaner, more mobile-friendly, and more natural for testers.

This phase must fix the product-owner feedback listed below without breaking the already working backend/API flow.

## Current app context

Frontend technology:

```text
React + TypeScript + Vite + Redux Toolkit + RTK Query + Tailwind CSS
```

Local frontend:

```text
http://localhost:5173
```

Local backend:

```text
http://localhost:8000
```

Online dev frontend:

```text
https://metril.darkube.ir
```

Online dev backend:

```text
https://hw2momirzadipayload.darkube.ir
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For online dev build:

```env
VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

Important: Vite injects `VITE_API_BASE_URL` at build time.

## Required references

Before changing code, read:

```text
AI_CODE_PRINCIPLES.md
backend_docs/history/v0.0/frontend_handoff_v0_0.md
backend_docs/history/v0.0/OPENAPI.yaml
code_oder/COMMON_FRONTEND_CODEX_RULES.md
docs/product_reference/v0.0/PRODUCT_FLOW_NOTES.md
code_oder/v0.0/phaze9/REPORT.md
code_oder/v0.0/phaze9/TEST_RESULTS.md
```

Also read the provided landing page HTML reference.

Suggested reference path:

```text
docs/product_reference/v0.0/landing_reference.html
```

If the file is not already there, copy the provided HTML reference into that path and use it only as a design reference.

## Critical brand requirement

The frontend brand is now:

```text
Metril / متریل
```

Update visible frontend UI text so the user-facing product name is `Metril` / `متریل`.

Remove visible user-facing occurrences of:

```text
Ratab
رتب
METROPLAN
متروپلن
```

unless they are inside old docs/reports or non-user-facing internal text where changing is risky.

Do not rename internal code identifiers unless it is safe and minimal.

## Strict rules

- Work only on Frontend Phase 10.
- Do not create backend code.
- Do not modify backend files.
- Do not invent endpoints.
- Do not hardcode backend URLs in source.
- Do not hardcode IDs.
- Do not hardcode `price_set_id`.
- Do not use `VITE_DEFAULT_PRICE_SET_ID` in normal flow.
- Use backend-provided `selectedEdition.active_price_set.id`.
- Do not expose raw technical ids in normal UI.
- Do not treat missing official prices as zero.
- Do not fake calculation behavior if backend/schema does not support it.
- Do not log tokens or secrets.
- Do not commit or push.
- Keep Persian RTL UX.
- Keep dark glassmorphism theme.
- Make the app much more user-friendly.
- Make the app mobile-friendly.
- Keep existing working API flow intact.

## Major product-owner feedback to implement

### 1. Landing page background and design

The public landing page background should be closer to the provided HTML reference.

Requirements:

- Dark `#05050a`-like background.
- Premium glassmorphism feel.
- Subtle animated/depth/particle background if practical.
- No horizontal overflow.
- Strong Persian hero section.
- Responsive on mobile.
- Use `Metril / متریل` branding.
- Do not paste raw HTML as production React.
- Do not keep CDN Tailwind, Alpine, inline script tags, or unsafe external scripts.
- If using Three.js/GSAP, install/import properly and clean up effects on unmount.
- If animation is too much risk, implement a lightweight CSS/canvas background that feels close.

### 2. Authenticated root behavior

If the user is already logged in and opens `/`, the app should route the user into their workspace/user area instead of showing the public landing page.

Expected behavior:

```text
Unauthenticated /  → public landing page
Authenticated /    → user workspace / companies/dashboard
/login             → login page
Protected routes   → RequireAuth
```

If there is no obvious workspace target, route authenticated users to the company list/dashboard page.

### 3. Mobile friendliness

Fix mobile layout issues across key pages:

- Public landing page currently overflows or content goes outside the frame.
- Login second step/buttons can become too small.
- Dashboard/company mobile nav takes too much screen space.
- Modals should fit mobile screens.
- Item lists should scroll internally, not stretch entire page.
- Buttons must remain tappable.
- Avoid horizontal overflow globally.

Add or improve responsive rules:

```text
max-width
overflow-x-hidden
responsive padding
scrollable panels
stacked actions on small screens
compact nav on mobile
```

### 4. Company dashboard should feel like a messenger

The company dashboard/messages page should feel like a chat/messenger workspace.

Requirements:

- Default company page should be messages.
- Provide a message composer.
- Allow sending simple local/dev messages if backend does not support real messaging.
- Do not invent backend messaging endpoints.
- If messages are local-only for now, document that clearly.
- The plus/attachment button should feel like selecting an attachment in a messenger.
- The “فهرست‌بها / افزودن صورت‌بها” option should not feel locked.
- After selecting/creating a pricebook/cost-report attachment, return to the messages page.
- The selected attachment should appear above the message input, like an attached file in a messenger.
- User can then send it.
- After sending, show a message bubble/card representing the attached صورت‌بها / فهرست‌بها flow.
- Keep the route to continue/edit that صورت‌بها.

### 5. Pricebook list must be active

The pricebook list section must be functional and clickable.

Do not leave disabled/locked options unless the backend truly cannot support them.

If a feature is not implemented, show a friendly explanation, not a dead/disabled primary path.

### 6. Companies page should be more compact

The “شرکت‌های شما” page currently uses too much vertical space with a large title and long explanation.

Make it more compact:

- Smaller title.
- Shorter explanation.
- More focus on company list and create company CTA.
- Move detailed explanation to the Help page.

### 7. Move excessive dashboard explanations to Help

Many pages currently use too much space for explanatory text.

Reduce large text blocks in dashboard/workspace pages.

Create or enable a dedicated Help/Guide page and move detailed guidance there.

### 8. Build a real Help page

The help page is currently disabled or incomplete.

Build it.

Requirements:

- Route example: `/help`, or use the existing help route if one exists.
- Add useful sections:
  - شروع کار
  - ساخت شرکت
  - افزودن صورت‌بها
  - انتخاب فهرست‌بها
  - محاسبه آیتم
  - الزامات و تبصره‌ها
  - ضرایب
  - خروجی و پیش‌نمایش
  - محدودیت‌های نسخه آزمایشی
- Important UI elements may have a `?` icon.
- Clicking `?` should navigate to the relevant help section or open a help panel.
- Keep Help page readable, Persian, RTL, and visually polished.

### 9. Guided onboarding must be improved

The current first-time guide is weak.

Improve it:

- Dim the whole page.
- Highlight/focus the target element being explained.
- The explanation should point to the actual UI element.
- The guide should be step-by-step.
- It should explain the important actions:
  - add company;
  - company messages;
  - plus/attachment button;
  - add صورت‌بها;
  - select pricebook;
  - calculate item;
  - add line to document.
- It must be dismissible.
- Persist dismissed state locally.
- Keep it mobile-friendly.
- Do not cover the whole screen in a way that prevents using the app.

### 10. Modals and popovers should close on outside click

For modals/popovers such as:

- add cost report menu;
- plus attachment menu;
- navbar/menu;
- coefficient drawer;
- help popovers;

User-friendly behavior:

- close on outside click;
- close on Escape;
- avoid accidental stuck overlays;
- do not close if the user clicks inside the modal content.

### 11. Improve card distinguishability

Some cards/panels are too visually similar.

Improve visual hierarchy:

- stronger but subtle borders;
- better spacing;
- clearer section headers;
- gentle contrast differences;
- hover/focus states;
- no heavy noisy redesign.

### 12. Add row/item modal refinement

The “add row / calculation modal” must be significantly improved.

#### Requirements/الزامات display

Do not show:

```text
requirement
requirment
requirements id
requirement id
raw ids
```

Instead:

- Use Persian title: `الزامات`.
- Show requirements as readable paragraphs/bullets.
- Put them below the quantity input area.
- Do not show internal ids.
- Do not show raw technical keys.

#### Footnotes/تبصره‌ها display

Do not show raw footnote ids.

Use title:

```text
تبصره‌ها
```

For each footnote:

- Show full text from the beginning.
- Do not hide behind collapsed cards by default.
- Number them simply: ۱، ۲، ۳.
- Show a checkbox next to each footnote so user can confirm/acknowledge it.
- Do not label them with database ids.

#### Footnote confirmation and calculation

The checkbox state must matter.

Rules:

- Inspect backend schema and calculation endpoint.
- If the calculation endpoint supports passing selected/confirmed notes/options, include them in the calculation payload.
- If backend does not support sending footnote confirmations:
  - do not fake backend calculation;
  - enforce frontend validation for required acknowledgements where safe;
  - document backend gap in Phase 10 report.
- If some footnotes affect extra price/starred price, the UI should show required input clearly.
- Do not treat missing/manual/starred price as zero.

#### Calculate → Edit/Send flow

Current flow should become:

1. User enters quantity and checks relevant footnotes.
2. User clicks `محاسبه`.
3. Inputs become disabled:
   - quantity;
   - checkboxes;
   - any relevant inputs.
4. Calculation result appears.
5. If backend calculation response includes a message/warning from Python calculate logic, display it below the result.
6. The original button area changes to two buttons:

```text
ویرایش
ارسال
```

7. Clicking `ویرایش`:
   - re-enables inputs;
   - returns button state to `محاسبه`;
   - user can modify quantity/checks.
8. Clicking `ارسال`:
   - adds/sends the calculated line according to the existing flow;
   - closes modal;
   - shows a small toast at top-left.

Toast copy example:

```text
ردیف به صورت‌بها اضافه شد.
```

The modal must not stay open after successful send.

### 13. Toast behavior

Add/ensure a polished toast system if not already present.

Requirements:

- Position: top-left in RTL UI.
- Small and unobtrusive.
- Used for:
  - line added;
  - message sent;
  - save success;
  - user-friendly errors where appropriate.
- Do not spam toasts.
- Keep accessible text.

### 14. User-friendly wording

Remove developer-facing text from normal UI.

Avoid:

```text
backend endpoint
price_set_id
API payload
requirments
id
```

Use user-facing Persian:

```text
نسخه آزمایشی
فهرست‌بها
صورت‌بها
الزامات
تبصره‌ها
محاسبه
پیش‌نمایش
```

### 15. Maintain working local/dev flow

Do not break existing working flow:

```text
login
→ company
→ add صورت‌بها
→ select ABN1404/1404
→ create project/document
→ browse chapters/groups/items
→ calculate item
→ add line
→ totals update
→ preview/export behavior
```

## Backend/API constraints

Use only documented backend APIs.

If a requested UX requires backend data that does not exist, do one of:

1. Implement UI-only behavior clearly marked as local/dev-only if it does not affect calculations.
2. Block with friendly message.
3. Document backend gap in report.

Do not invent API endpoints.

## Suggested implementation areas

Likely files/components to inspect:

```text
src/app/router.tsx
src/app/App.tsx
src/pages/LandingPage.tsx
src/pages/LoginPage.tsx
src/pages/CompaniesPage.tsx
src/pages/CompanyDashboardPage.tsx
src/pages/CostReportWizardPage.tsx
src/features/auth/
src/features/onboarding/
src/features/companies/
src/features/pricebooks/
src/features/financialDocuments/
src/features/coefficients/
src/shared/components/
src/shared/utils/
src/styles/
```

## Verification checklist

Run:

```bash
npm run build
npm run lint
```

If tests exist:

```bash
npm test
```

Manual smoke test local:

```text
/
login
company list
company dashboard
send a simple message
attach/start صورت‌بها from chat
select ABN1404/1404
browse pricebook
open item modal
see الزامات without ids
see تبصره‌ها without ids
check footnote checkbox
calculate
edit
calculate again
send
toast appears
modal closes
line appears in document
preview/export still behave
mobile viewport works
```

## Reports

Create/update only:

```text
code_oder/v0.0/phaze10/REPORT.md
code_oder/v0.0/phaze10/TEST_RESULTS.md
```

Do not create random extra report files.

`REPORT.md` must include:

```text
# Frontend Phase 10 Report

## Summary
## Scope
## Files Created
## Files Modified
## Implementation Details
## Branding Notes
## Landing Page Notes
## Mobile UX Notes
## Messenger Dashboard Notes
## Calculation Modal Notes
## Help and Onboarding Notes
## API Contract Notes
## Issues and Findings
## Risks and Assumptions
## User Actions Required
## Suggested Commit Message
## Next Step
```

`TEST_RESULTS.md` must include:

```text
# Frontend Phase 10 Test Results

## Commands Run
## Results
## Failed Tests
## Tests Not Run
## Manual Smoke Checklist
## Notes
```

## Final response format

At the end, print:

```text
Summary
```

Then:

```text
User actions required
```

Then:

```text
Suggested commit message
```

Suggested commit message:

```text
fix(frontend-phase10): polish metril ux and calculation flow
```

Stop after Phase 10 only.
