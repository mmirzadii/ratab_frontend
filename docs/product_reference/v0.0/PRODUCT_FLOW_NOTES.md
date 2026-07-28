# Product Flow Notes — Ratab Frontend v0.0

## Login / registration

- No OTP for now.
- User enters phone number.
- If not registered, user enters a password/registration secret in the next step.
- When confirmed, the user is registered/logged in.
- Returning users log in with phone and password/secret.
- If backend lacks this exact flow, report the mismatch and use only supported backend behavior.

## After login

- Show company list.
- Make `افزودن شرکت` visually prominent.
- First-time onboarding highlights add company.

## Create company

- User enters company name and company id/identifier if backend supports it.
- After creation, company appears in list and user enters company page automatically.

## Company page

- Simple page.
- Two navigation areas: main dashboard nav and company-specific nav.
- Default company page: company messages.
- Company nav examples: پیام‌های شرکت، اطلاعات شرکت، تنظیمات شرکت، صورت‌بهاها، ضرایب.

## Company messages

- Messenger-like UI.
- Bottom-left plus button like messenger attachment/add.
- Plus opens add cost report / صورت‌بها flow.
- Onboarding points to the plus button and explains فهرست‌بها-based calculations.

## Add cost report / صورت‌بها

- Opens page/wizard.
- User enters project/report name and required fields.
- Year defaults to 1404.
- After confirmation, navigate to pricebook chapter selection.

## Pricebook browser

- Show chapters.
- Top filter divides chapters into about 3 to 8 high-level sections.
- Selecting a section filters chapters.
- Selecting a chapter opens item/group browsing.
- Group filter appears above item list.
- Clicking item opens modal.

## Item modal

Must show item info, row ids, unit, official price if present, footnotes, requirments, calculation input, manual/starred price UI.

If footnote requires starred price, clicking footnote opens starred price input under it.

If item has no official price, show:

```text
قیمت ستاره‌دار
```

Never treat missing price as zero.

## Account settings

Theme can switch night/day and should persist locally at minimum.
