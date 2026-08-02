# UI Content Guidelines

Rules for copy in the Ratab (متریل) frontend.
Authenticated product screens use operational language; public landing pages may use marketing copy.

## Page titles

- One primary title per page (`شرکت‌ها`, `افزودن شرکت`, `راهنما`).
- Optional compact status/count beside or under the title.
- Primary actions sit with the header; list/form starts immediately below.
- Do not wrap authenticated headers in a hero `GlassCard`.
- Use shared `PageHeader` when the pattern fits.

## Subtitles

- Prefer no subtitle.
- Keep only when it adds information needed to proceed (status, permission, blocker).
- Remove generic lines such as «در این بخش می‌توانید…».

## Helper text

Field priority:

1. Persistent label
2. Useful placeholder example
3. Contextual help for non-obvious meaning
4. Inline helper only when it prevents a likely mistake
5. Validation after feedback is needed

Do not stack label + `اختیاری` + placeholder `اختیاری` + helper + help icon.

## Contextual help

Use shared `ContextualHelp` for field/section help.

- Trigger: small circular help icon (~16–18px), larger hit area, beside the label.
- Desktop: hover + keyboard focus; Escape / leave closes.
- Mobile: tap toggletip; second tap or outside closes.
- Content: one or two short Persian sentences; no marketing; no validation.
- Do **not** add help to obvious controls: نام شرکت، نام پروژه، عنوان، توضیحات، تاریخ، ذخیره، حذف، انصراف.

## Placeholders

- Examples only (`مثلا metril-tehran`).
- Never English implementation tokens (`optional-company-slug`).
- Prefer optional grouping (`اطلاعات تکمیلی`) over repeating `اختیاری` in every field.

## Empty states

- One direct title
- Optional one short sentence
- One relevant primary action

## Authenticated vs marketing

Landing may keep intentional marketing.
Authenticated UI must avoid: فضای حرفه‌ای شما، تجربه‌ای متفاوت، مدیریت هوشمند، همه چیز در یک نگاه، فضای شرکت‌های متریل، آماده شروع هستید.

## Persian tone

Prefer: شرکت‌ها، افزودن شرکت، اطلاعات تکمیلی، حذف پروژه، در انتظار تایید، ذخیره شد.
Avoid: می‌باشد، می‌گردد، بدین وسیله، لازم به ذکر است.

Consistent terms: شرکت، پروژه، گروه، صورت بها، فهرست بها، عضو، ضریب، ردیف، سال، نوع.

## Correct / incorrect

**Correct — company list:** title `شرکت‌ها`, actions `افزودن شرکت` / `به‌روزرسانی`, optional count, list immediately below.

**Incorrect:** badge `فضای شرکت‌های متریل`, duplicate `شرکت‌های شما`, long subtitle, oversized hero card.

**Correct — company create:** `افزودن شرکت`, required `نام شرکت *`, optional `اطلاعات تکمیلی`, help on نام حقوقی / شناسه کوتاه, placeholder `مثلا metril-tehran`.

**Incorrect:** intro «فقط نام شرکت الزامی است…», placeholder `optional-company-slug`.
